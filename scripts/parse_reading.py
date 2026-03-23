#!/usr/bin/env python3
"""
parse_reading.py — Convert Docling markdown output into ReadingSection JSON
that can be POSTed directly to /api/admin/reading.

Pipeline:
  1. docling  cambridge_XX.pdf  -o output/
  2. python3 scripts/parse_reading.py output/cambridge_XX.md 20
     → writes reading_sections_book20.json
  3. python3 scripts/parse_reading.py output/cambridge_XX.md 20 --upload
     → also POSTs each section to the running Next.js app

Designed for Cambridge IELTS books where each test has 3 reading passages.
"""

import re
import sys
import json
import argparse
from pathlib import Path

# ── Question-type detection ────────────────────────────────────

TFNG_RE = re.compile(
    r"(true|false|not\s*given)", re.I
)
YNNGT_RE = re.compile(
    r"(yes|no|not\s*given)", re.I
)
MCQ_RE = re.compile(r"^\s*[A-E]\s", re.M)
HEADING_RE = re.compile(r"match.*heading", re.I)
INFO_RE = re.compile(r"match.*information|which\s+paragraph", re.I)
FEATURE_RE = re.compile(r"match.*feature|match.*person|match.*researcher", re.I)
SENTENCE_END_RE = re.compile(r"match.*sentence\s*ending|complete.*sentence", re.I)
SENTENCE_COMP_RE = re.compile(r"complete.*sentence|sentence\s*completion", re.I)
SUMMARY_RE = re.compile(r"summary|complete.*summary", re.I)
NOTE_RE = re.compile(r"note\s*completion|complete.*note", re.I)
TABLE_RE = re.compile(r"table\s*completion|complete.*table", re.I)
DIAGRAM_RE = re.compile(r"diagram|label.*diagram|flow\s*chart", re.I)
SHORT_RE = re.compile(r"short\s*answer|no\s*more\s*than", re.I)
WORD_LIMIT_RE = re.compile(
    r"((?:NO\s+MORE\s+THAN\s+)?\w+\s+WORDS?(?:\s+AND\/OR\s+A\s+NUMBER)?)",
    re.I,
)


def detect_question_type(instructions: str) -> str:
    """Guess IELTS question type from the instruction block."""
    txt = instructions.lower()
    if "true" in txt and "false" in txt and "not given" in txt:
        return "true-false-not-given"
    if "yes" in txt and "no" in txt and "not given" in txt:
        return "yes-no-not-given"
    if HEADING_RE.search(instructions):
        return "matching-headings"
    if INFO_RE.search(instructions):
        return "matching-information"
    if FEATURE_RE.search(instructions):
        return "matching-features"
    if SENTENCE_END_RE.search(instructions):
        return "matching-sentence-endings"
    if DIAGRAM_RE.search(instructions):
        return "diagram-label-completion"
    if TABLE_RE.search(instructions):
        return "table-completion"
    if NOTE_RE.search(instructions):
        return "note-completion"
    if SUMMARY_RE.search(instructions):
        return "summary-completion"
    if SENTENCE_COMP_RE.search(instructions):
        return "sentence-completion"
    if MCQ_RE.search(instructions):
        return "multiple-choice"
    if SHORT_RE.search(instructions):
        return "short-answer"
    return "short-answer"


def extract_word_limit(instructions: str) -> str | None:
    m = WORD_LIMIT_RE.search(instructions)
    return m.group(1).strip() if m else None


# ── Markdown splitting ─────────────────────────────────────────

# Matches "## READING PASSAGE 1", "## Reading Passage 2", "# PASSAGE 1" etc.
PASSAGE_SPLIT_RE = re.compile(
    r"^#{1,3}\s*(?:READING\s+)?PASSAGE\s+(\d)",
    re.I | re.M,
)

# Matches "Questions 1-6", "Questions 27–40" (en-dash or hyphen)
QUESTION_GROUP_RE = re.compile(
    r"^#{0,4}\s*Questions?\s+(\d{1,2})\s*[-–]\s*(\d{1,2})",
    re.I | re.M,
)

# Individual numbered question: "1  The writer thinks…", "27. Water is…"
NUMBERED_Q_RE = re.compile(r"^\s*(\d{1,2})\s*[.)]\s+(.+)", re.M)

# MCQ option line:  "A  something"
OPTION_RE = re.compile(r"^\s*([A-G])\s{1,4}(.+)", re.M)

# Test boundary
TEST_SPLIT_RE = re.compile(r"^#{1,2}\s*TEST\s+(\d)", re.I | re.M)


def split_tests(md: str) -> list[tuple[int, str]]:
    """Split full book markdown into (testNumber, content) pairs."""
    hits = list(TEST_SPLIT_RE.finditer(md))
    if not hits:
        return [(1, md)]
    parts: list[tuple[int, str]] = []
    for i, m in enumerate(hits):
        start = m.start()
        end = hits[i + 1].start() if i + 1 < len(hits) else len(md)
        parts.append((int(m.group(1)), md[start:end]))
    return parts


def split_passages(test_md: str) -> list[tuple[int, str]]:
    """Split a single test into (partNumber, content) tuples."""
    hits = list(PASSAGE_SPLIT_RE.finditer(test_md))
    if not hits:
        return [(1, test_md)]
    parts: list[tuple[int, str]] = []
    for i, m in enumerate(hits):
        start = m.start()
        end = hits[i + 1].start() if i + 1 < len(hits) else len(test_md)
        parts.append((int(m.group(1)), test_md[start:end]))
    return parts


# ── Parse a single passage section ─────────────────────────────

def extract_title(text: str) -> str:
    """First non-empty, non-heading line is likely the passage title."""
    for line in text.split("\n"):
        stripped = line.strip().strip("#").strip()
        if not stripped:
            continue
        if re.match(r"(?:READING\s+)?PASSAGE\s+\d", stripped, re.I):
            continue
        if re.match(r"You should spend", stripped, re.I):
            continue
        if len(stripped) > 5:
            return stripped[:120]
    return "Untitled Passage"


def split_passage_and_questions(text: str) -> tuple[str, str]:
    """Return (passage_body, questions_section)."""
    # Find first "Questions X-Y" header
    m = QUESTION_GROUP_RE.search(text)
    if m:
        return text[: m.start()].strip(), text[m.start() :].strip()
    return text.strip(), ""


def parse_question_groups(qs_text: str) -> list[dict]:
    """Parse all question groups from the questions section."""
    groups: list[dict] = []
    group_hits = list(QUESTION_GROUP_RE.finditer(qs_text))

    for i, hit in enumerate(group_hits):
        start_q = int(hit.group(1))
        end_q = int(hit.group(2))
        block_start = hit.end()
        block_end = group_hits[i + 1].start() if i + 1 < len(group_hits) else len(qs_text)
        block = qs_text[block_start:block_end]

        # Instruction text is everything before the first numbered question
        first_q = NUMBERED_Q_RE.search(block)
        instructions = block[: first_q.start()].strip() if first_q else block.strip()
        # Clean markdown formatting from instructions
        instructions = re.sub(r"[#*_]", "", instructions).strip()

        q_type = detect_question_type(instructions)
        word_limit = extract_word_limit(instructions)

        # Extract matching options (lines starting with A-G before questions, or roman numerals)
        matching_options: list[str] = []
        if "matching" in q_type:
            matching_options = [
                f"{m.group(1)} {m.group(2)}"
                for m in OPTION_RE.finditer(instructions)
            ]

        # Parse individual questions
        questions: list[dict] = []
        q_matches = list(NUMBERED_Q_RE.finditer(block))
        for qi, qm in enumerate(q_matches):
            q_num = int(qm.group(1))
            if q_num < start_q or q_num > end_q:
                continue
            q_text = qm.group(2).strip()

            # Check for MCQ options right after the question
            options: list[str] = []
            if q_type == "multiple-choice":
                q_end = q_matches[qi + 1].start() if qi + 1 < len(q_matches) else len(block)
                q_block = block[qm.end() : q_end]
                options = [
                    f"{om.group(1)} {om.group(2)}"
                    for om in OPTION_RE.finditer(q_block)
                ]

            q_obj: dict = {
                "questionNumber": q_num,
                "questionText": q_text,
                "correctAnswer": "",  # filled manually or from answer key
            }
            if options:
                q_obj["options"] = options
            questions.append(q_obj)

        # If we couldn't parse individual questions, generate placeholders
        if not questions:
            for n in range(start_q, end_q + 1):
                questions.append({
                    "questionNumber": n,
                    "questionText": "",
                    "correctAnswer": "",
                })

        group: dict = {
            "groupLabel": f"Questions {start_q}-{end_q}",
            "questionType": q_type,
            "instructions": instructions,
            "startQuestion": start_q,
            "endQuestion": end_q,
            "questions": questions,
        }
        if matching_options:
            group["matchingOptions"] = matching_options
        if word_limit:
            group["wordLimit"] = word_limit

        groups.append(group)

    return groups


def parse_passage(part_num: int, text: str, book: int, test: int) -> dict:
    """Parse a single passage section into a ReadingSection-shaped dict."""
    title = extract_title(text)
    passage_body, qs_text = split_passage_and_questions(text)

    # Clean passage body: remove markdown headers, keep paragraphs
    clean_lines: list[str] = []
    for line in passage_body.split("\n"):
        stripped = line.strip()
        if re.match(r"^#{1,4}\s", stripped):
            # Keep heading text, drop the #
            clean_lines.append(stripped.lstrip("#").strip())
        elif stripped:
            clean_lines.append(stripped)
        else:
            clean_lines.append("")
    passage_clean = "\n".join(clean_lines).strip()

    # Remove the title from passage body if it starts with it
    if passage_clean.startswith(title):
        passage_clean = passage_clean[len(title) :].strip()

    question_groups = parse_question_groups(qs_text) if qs_text else []

    difficulty_map = {1: "beginner", 2: "intermediate", 3: "advanced"}

    return {
        "bookNumber": book,
        "testNumber": test,
        "partNumber": part_num,
        "title": title,
        "topic": "General",
        "difficulty": difficulty_map.get(part_num, "intermediate"),
        "passage": passage_clean,
        "questionGroups": question_groups,
    }


# ── Main ───────────────────────────────────────────────────────

def parse_book(md_path: str, book_number: int) -> list[dict]:
    """Parse an entire Docling markdown file into ReadingSection dicts."""
    md = Path(md_path).read_text(encoding="utf-8")

    sections: list[dict] = []
    tests = split_tests(md)
    print(f"Found {len(tests)} test(s) in the markdown.")

    for test_num, test_md in tests:
        passages = split_passages(test_md)
        print(f"  Test {test_num}: {len(passages)} passage(s)")
        for part_num, passage_md in passages:
            section = parse_passage(part_num, passage_md, book_number, test_num)
            total_qs = sum(len(g["questions"]) for g in section["questionGroups"])
            print(
                f"    Part {part_num}: \"{section['title'][:50]}\" "
                f"— {len(section['questionGroups'])} group(s), {total_qs} question(s)"
            )
            sections.append(section)

    return sections


def upload_sections(sections: list[dict], base_url: str) -> None:
    """POST each section to the admin API."""
    try:
        import requests
    except ImportError:
        print("Install requests to use --upload: pip install requests")
        sys.exit(1)

    url = f"{base_url}/api/admin/reading"
    for s in sections:
        label = f"Book {s['bookNumber']} Test {s['testNumber']} Part {s['partNumber']}"
        try:
            r = requests.post(url, json=s, timeout=10)
            if r.ok:
                print(f"  Uploaded: {label}")
            else:
                print(f"  FAILED {label}: {r.status_code} {r.text[:200]}")
        except Exception as e:
            print(f"  ERROR {label}: {e}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Parse Docling markdown into ReadingSection JSON"
    )
    parser.add_argument("md_file", help="Path to the Docling .md output file")
    parser.add_argument("book_number", type=int, help="Cambridge IELTS book number")
    parser.add_argument(
        "--upload",
        action="store_true",
        help="Also POST sections to the running Next.js app",
    )
    parser.add_argument(
        "--api-url",
        default="http://localhost:3000",
        help="Base URL of the Next.js app (default: http://localhost:3000)",
    )
    parser.add_argument(
        "--answer-key",
        help="Path to a JSON answer key file: { '1': 'TRUE', '2': 'B', ... }",
    )
    args = parser.parse_args()

    sections = parse_book(args.md_file, args.book_number)

    # Merge answer key if provided
    if args.answer_key:
        key_path = Path(args.answer_key)
        if key_path.exists():
            answers = json.loads(key_path.read_text(encoding="utf-8"))
            merged = 0
            for section in sections:
                for group in section["questionGroups"]:
                    for q in group["questions"]:
                        ans = answers.get(str(q["questionNumber"]))
                        if ans:
                            q["correctAnswer"] = ans
                            merged += 1
            print(f"\nMerged {merged} answers from key.")
        else:
            print(f"Warning: answer key not found at {args.answer_key}")

    # Write JSON
    out_name = f"reading_sections_book{args.book_number}.json"
    out_path = Path(args.md_file).parent / out_name
    out_path.write_text(json.dumps(sections, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {len(sections)} section(s) to {out_path}")

    if args.upload:
        print(f"\nUploading to {args.api_url}...")
        upload_sections(sections, args.api_url)


if __name__ == "__main__":
    main()
