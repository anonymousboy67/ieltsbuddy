import Anthropic from "@anthropic-ai/sdk";
import type { AnswerMap } from "./parse-answers";
import type {
  IReadingSection,
  IListeningSection,
  IWritingTask,
  ISpeakingPart,
} from "../../src/types/ielts";

const MODEL = "claude-sonnet-4-20250514";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

function answersToString(answers: AnswerMap): string {
  if (answers.size === 0) return "No answer key available.";
  const lines: string[] = [];
  const sorted = [...answers.entries()].sort((a, b) => a[0] - b[0]);
  for (const [num, ans] of sorted) {
    if (Array.isArray(ans)) {
      lines.push(`${num}: ${ans.join(", ")}`);
    } else {
      lines.push(`${num}: ${ans}`);
    }
  }
  return lines.join("\n");
}

const PARSER_SYSTEM_PROMPT = `You are a precise IELTS test content parser. You receive raw markdown text extracted from Cambridge IELTS books and a set of correct answers. Your job is to output valid JSON matching the provided TypeScript interfaces.

RULES:
1. Identify every question group by looking for instruction patterns like:
   - "Choose the correct letter" -> MULTIPLE_CHOICE
   - "Choose TWO letters" -> MULTIPLE_SELECT
   - "TRUE / FALSE / NOT GIVEN" -> TRUE_FALSE_NOT_GIVEN
   - "YES / NO / NOT GIVEN" -> YES_NO_NOT_GIVEN
   - "Complete the notes" -> NOTE_COMPLETION
   - "Complete the summary" -> SUMMARY_COMPLETION
   - "Complete the sentences" or "Complete each sentence" (with word blanks) -> SENTENCE_COMPLETION
   - "Complete each sentence with the correct ending" -> MATCHING_SENTENCE_ENDINGS
   - "Which section contains" or "Which paragraph" -> MATCHING_INFORMATION
   - "Match each statement with the correct person" or matching features -> MATCHING_FEATURES
   - "match the headings" or "choose the correct heading" -> MATCHING_HEADINGS
   - "Complete the table" -> TABLE_COMPLETION
   - "Complete the form" -> FORM_COMPLETION
   - "Complete the flow chart" or "flow-chart" -> FLOW_CHART_COMPLETION
   - "Label the diagram" -> DIAGRAM_LABELLING
   - "Label the map" or "Label the plan" -> MAP_LABELLING
   - "Short answer" or standalone word-limit questions -> SHORT_ANSWER

2. For each question, match the correctAnswer from the provided answer key.

3. For MULTIPLE_SELECT paired questions (like 17-18, 21-22), store:
   - Two question entries with consecutive numbers
   - correctAnswer as a string array: ["A", "E"]

4. For completion types, preserve the full template text with blank markers. CRITICAL: every blank MUST use the format (N) ...... where N is the question number in parentheses, e.g. "Sales of (32) ...... food brands". NEVER use bare numbers like "32 ___" or "32__________".

5. For passages with lettered sections (A, B, C...), split into passageSections array with label and text.

6. Extract wordLimit from instructions: "ONE WORD ONLY", "ONE WORD AND/OR A NUMBER", "NO MORE THAN TWO WORDS", etc.

7. Set allowRepeat: true when instructions say "You may use any letter more than once."

8. For matchingOptions, use objects with letter and text fields: [{"letter": "A", "text": "Matt Elliot"}, ...]

9. Respond with ONLY valid JSON. No markdown, no explanation, no backticks wrapping.`;

async function callClaude(
  userPrompt: string,
  options?: { systemPrompt?: string; maxTokens?: number }
): Promise<string> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: options?.maxTokens ?? 8000,
    system: options?.systemPrompt ?? PARSER_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return text.trim();
}

function parseJSON<T>(raw: string): T {
  let text = raw.trim();

  // Strip code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(text);
  } catch {
    const braceMatch = text.match(/[\[{][\s\S]*[\]}]/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {
        const fixed = braceMatch[0].replace(/"([^"]*)"/g, (_m, v: string) => {
          return `"${v.replace(/\n/g, "\\n").replace(/\r/g, "\\r")}"`;
        });
        return JSON.parse(fixed);
      }
    }
    throw new Error(`Failed to parse JSON from Claude response: ${text.slice(0, 200)}`);
  }
}

/**
 * Split reading markdown into per-passage chunks so each Claude call is small.
 */
function splitReadingPassages(rawMarkdown: string): { passageNumber: number; text: string }[] {
  // Look for "READING PASSAGE 1", "## Reading Passage 2", "Passage 1", etc.
  const passagePattern = /(?:^|\n)#{0,3}\s*(?:\*\*)?(?:READING\s+)?PASSAGE\s+(\d)(?:\*\*)?/gi;
  const hits: { index: number; passageNumber: number }[] = [];
  let match;
  while ((match = passagePattern.exec(rawMarkdown)) !== null) {
    hits.push({ index: match.index, passageNumber: parseInt(match[1]) });
  }

  if (hits.length === 0) {
    // No clear passage markers — send the whole thing as passage 1
    return [{ passageNumber: 1, text: rawMarkdown }];
  }

  // Deduplicate: keep first occurrence of each passage number
  const seen = new Set<number>();
  const unique: { index: number; passageNumber: number }[] = [];
  for (const h of hits) {
    if (!seen.has(h.passageNumber)) {
      seen.add(h.passageNumber);
      unique.push(h);
    }
  }
  unique.sort((a, b) => a.index - b.index);

  const passages: { passageNumber: number; text: string }[] = [];
  for (let i = 0; i < unique.length; i++) {
    const start = unique[i].index;
    const end = i + 1 < unique.length ? unique[i + 1].index : rawMarkdown.length;
    passages.push({
      passageNumber: unique[i].passageNumber,
      text: rawMarkdown.slice(start, end).trim(),
    });
  }
  return passages;
}

/**
 * Filter answer map to only include questions in a given range.
 */
function filterAnswers(answers: AnswerMap, startQ: number, endQ: number): AnswerMap {
  const filtered: AnswerMap = new Map();
  for (const [num, ans] of answers) {
    if (num >= startQ && num <= endQ) {
      filtered.set(num, ans);
    }
  }
  return filtered;
}

export async function parseReadingSections(
  rawMarkdown: string,
  answers: AnswerMap,
  bookNumber: number,
  testNumber: number
): Promise<IReadingSection[]> {
  const passageChunks = splitReadingPassages(rawMarkdown);
  console.log(`  Split reading into ${passageChunks.length} passage chunk(s)`);

  // Standard IELTS reading question ranges per passage
  const questionRanges: Record<number, [number, number]> = {
    1: [1, 13],
    2: [14, 26],
    3: [27, 40],
  };

  const sections: IReadingSection[] = [];

  for (const chunk of passageChunks) {
    const range = questionRanges[chunk.passageNumber] ?? [1, 40];
    const passageAnswers = filterAnswers(answers, range[0], range[1]);
    const difficultyMap: Record<number, string> = { 1: "beginner", 2: "intermediate", 3: "advanced" };

    console.log(`  Parsing passage ${chunk.passageNumber} (Q${range[0]}-${range[1]}, ${passageAnswers.size} answers, ${chunk.text.length} chars)...`);

    const prompt = `Parse this single IELTS Reading Passage into ONE JSON object (not an array).

Book number: ${bookNumber}
Test number: ${testNumber}
Passage number: ${chunk.passageNumber}
Difficulty: "${difficultyMap[chunk.passageNumber] || "intermediate"}"

Return a single JSON object with:
- passageNumber: ${chunk.passageNumber}
- title: the passage title
- subtitle: subtitle if present, otherwise omit
- passage: the full passage text (clean, no markdown formatting)
- passageSections: if the passage has labeled sections A, B, C etc., split into [{label, text}]. Otherwise omit.
- topic: classify (nature, science, history, psychology, education, environment, health, technology, etc.)
- difficulty: "${difficultyMap[chunk.passageNumber] || "intermediate"}"
- totalQuestions: count of questions for this passage
- questionGroups: array of question group objects
- footnotes: any footnotes, otherwise omit

Question Group object:
{
  groupLabel: string (e.g. "Questions 1-6"),
  questionType: one of: "TRUE_FALSE_NOT_GIVEN", "YES_NO_NOT_GIVEN", "MULTIPLE_CHOICE", "MULTIPLE_SELECT", "NOTE_COMPLETION", "SUMMARY_COMPLETION", "SENTENCE_COMPLETION", "TABLE_COMPLETION", "FORM_COMPLETION", "FLOW_CHART_COMPLETION", "DIAGRAM_LABELLING", "MAP_LABELLING", "SHORT_ANSWER", "MATCHING_HEADINGS", "MATCHING_INFORMATION", "MATCHING_FEATURES", "MATCHING_SENTENCE_ENDINGS",
  instructions: string (the full instruction text),
  wordLimit?: string,
  startQuestion: number,
  endQuestion: number,
  matchingOptions?: [{letter: string, text: string}],
  completionTemplate?: string,
  tableData?: {headers: string[], rows: any[]},
  wordBank?: string[],
  sectionLabels?: string[],
  allowRepeat?: boolean,
  questions: [{questionNumber: number, questionText?: string, options?: string[], correctAnswer: string|string[]}]
}

ANSWER KEY for this passage:
${answersToString(passageAnswers)}

RAW MARKDOWN:
${chunk.text}`;

    const response = await callClaude(prompt);
    const section = parseJSON<IReadingSection>(response);

    sections.push({
      ...section,
      bookNumber,
      testNumber,
      passageNumber: chunk.passageNumber,
    });
  }

  return sections;
}

const LISTENING_SYSTEM_PROMPT = `You are a precise IELTS test content parser. You receive raw markdown text extracted from Cambridge IELTS books and a set of correct answers. Your job is to output valid JSON matching the provided interfaces.

CRITICAL REQUIREMENTS — every questionGroup MUST have ALL of these fields:
- "questionType": REQUIRED. Must be one of: "NOTE_COMPLETION", "SUMMARY_COMPLETION", "SENTENCE_COMPLETION", "TABLE_COMPLETION", "FORM_COMPLETION", "FLOW_CHART_COMPLETION", "DIAGRAM_LABELLING", "MAP_LABELLING", "SHORT_ANSWER", "MULTIPLE_CHOICE", "MULTIPLE_SELECT", "TRUE_FALSE_NOT_GIVEN", "YES_NO_NOT_GIVEN", "MATCHING_HEADINGS", "MATCHING_INFORMATION", "MATCHING_FEATURES", "MATCHING_SENTENCE_ENDINGS"
- "startQuestion": REQUIRED. The first question number in this group (e.g. 1).
- "endQuestion": REQUIRED. The last question number in this group (e.g. 10).
- "instructions": REQUIRED. The full instruction text. If no explicit instruction is visible, infer it from the question type (e.g. "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.").
- "groupLabel": REQUIRED. e.g. "Questions 1-10".
- "questions": REQUIRED. Array of question objects with questionNumber and correctAnswer.

If you cannot determine a questionType from the text, use your best judgment based on:
- Tables with blanks -> TABLE_COMPLETION
- Notes/bullet points with blanks -> NOTE_COMPLETION
- "Choose" + "letter" -> MULTIPLE_CHOICE
- "Choose TWO" -> MULTIPLE_SELECT

NEVER leave questionType, startQuestion, endQuestion, or instructions as null or undefined.

For matchingOptions, use objects: [{"letter": "A", "text": "description"}]

Respond with ONLY valid JSON. No markdown, no explanation, no backticks.`;

export async function parseListeningSections(
  rawMarkdown: string,
  answers: AnswerMap,
  bookNumber: number,
  testNumber: number
): Promise<IListeningSection[]> {
  const prompt = `Parse the following IELTS Listening section into a JSON array of 4 ListeningSection objects.

Book number: ${bookNumber}
Test number: ${testNumber}

Each object MUST have:
- partNumber (1, 2, 3, or 4) — REQUIRED integer
- title (descriptive title for this part) — REQUIRED string
- context (brief description of the conversation/monologue) — REQUIRED string
- totalQuestions (10 per part) — REQUIRED integer
- questionGroups — REQUIRED array of question group objects

Standard IELTS Listening structure (ALWAYS 4 parts, 10 questions each):
- Part 1: Questions 1-10 (conversation, everyday context)
- Part 2: Questions 11-20 (monologue, everyday context)
- Part 3: Questions 21-30 (conversation, academic context)
- Part 4: Questions 31-40 (monologue, academic context)

Each questionGroup MUST have ALL of these fields (none optional):
{
  "groupLabel": "Questions X-Y",
  "questionType": "TABLE_COMPLETION" | "NOTE_COMPLETION" | "MULTIPLE_CHOICE" | "MULTIPLE_SELECT" | "SENTENCE_COMPLETION" | "SUMMARY_COMPLETION" | "FORM_COMPLETION" | "FLOW_CHART_COMPLETION" | "MATCHING_FEATURES" | "SHORT_ANSWER" | etc.,
  "instructions": "Complete the table below. Write ONE WORD...",
  "startQuestion": X,
  "endQuestion": Y,
  "wordLimit": "ONE WORD AND/OR A NUMBER" (if applicable),
  "completionTemplate": "..." (for completion types — CRITICAL: every blank MUST use the format (N) ...... where N is the question number in parentheses, e.g. "The park covers (1) ...... hectares". NEVER use bare numbers like "1 ___" or "31__________"),
  "matchingOptions": [{"letter": "A", "text": "..."}] (for matching/select types),
  "allowRepeat": true/false,
  "questions": [{"questionNumber": 1, "questionText": "...", "correctAnswer": "..."}]
}

ANSWER KEY:
${answersToString(answers)}

RAW MARKDOWN:
${rawMarkdown}`;

  const response = await callClaude(prompt, {
    systemPrompt: LISTENING_SYSTEM_PROMPT,
    maxTokens: 8192,
  });
  const sections = parseJSON<IListeningSection[]>(response);

  return sections.map((s, i) => ({
    ...s,
    bookNumber,
    testNumber,
    partNumber: s.partNumber || i + 1,
  }));
}

export async function parseWritingTasks(
  rawMarkdown: string,
  bookNumber: number,
  testNumber: number
): Promise<IWritingTask[]> {
  const prompt = `Parse the following IELTS Writing section into a JSON array of WritingTask objects.

Book number: ${bookNumber}
Test number: ${testNumber}

Each task should have:
- taskNumber (1 or 2)
- taskType ("DESCRIBE_VISUAL" for Task 1, "ESSAY" for Task 2)
- prompt (the full task prompt text the student needs to respond to)
- instructions (the instruction line: "Summarise the information..." or "Give reasons...")
- minWords (150 for Task 1, 250 for Task 2)
- timeRecommended (20 for Task 1, 40 for Task 2)
- visualType (for Task 1 only: "LINE_GRAPH", "BAR_CHART", "PIE_CHART", "TABLE", "PROCESS_DIAGRAM", "MAP", "MIXED")
- tableData (for Task 1 if tables are described: [{title, headers, rows}])
- sampleAnswers (if sample essays/examiner comments are included)

RAW MARKDOWN:
${rawMarkdown}`;

  const response = await callClaude(prompt);
  const tasks = parseJSON<IWritingTask[]>(response);

  return tasks.map((t, i) => ({
    ...t,
    bookNumber,
    testNumber,
    taskNumber: t.taskNumber || i + 1,
  }));
}

export async function parseSpeakingParts(
  rawMarkdown: string,
  bookNumber: number,
  testNumber: number
): Promise<ISpeakingPart[]> {
  const prompt = `Parse the following IELTS Speaking section into a JSON array of SpeakingPart objects.

Book number: ${bookNumber}
Test number: ${testNumber}

Each part should have:
- partNumber (1, 2, or 3)
- partType ("INTERVIEW" for Part 1, "CUE_CARD" for Part 2, "DISCUSSION" for Part 3)
- topic (the topic of this part)
- instructions (for Part 2, the main instruction like "Describe a play or film...")
- questions (array of {questionNumber, questionText})
- cueCardPrompts (for Part 2: the bullet point prompts)
- cueCardFinalPrompt (for Part 2: the "and explain why..." prompt)
- prepTime (60 for Part 2)
- speakTime (120 for Part 2)
- sampleAnswers (if sample answers are provided: [{questionNumber?, answerText}])

RAW MARKDOWN:
${rawMarkdown}`;

  const response = await callClaude(prompt);
  const parts = parseJSON<ISpeakingPart[]>(response);

  return parts.map((p, i) => ({
    ...p,
    bookNumber,
    testNumber,
    partNumber: p.partNumber || i + 1,
  }));
}
