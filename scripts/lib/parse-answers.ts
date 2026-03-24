export type AnswerMap = Map<number, string | string[]>;

/**
 * Parse an answer block (from the back of a Cambridge IELTS book) into a map.
 *
 * Handles multiple formats:
 * - Pipe tables: | 1 | F |
 * - Comma-separated: 14, C  15, G
 * - Dot-separated: 11.A  12. B
 * - Hyphenated ranges for multi-select: 17-18.AE  or 17-18. A, E
 * - Word answers: 31, factories  32, dead
 * - Plain numbered: 1  TRUE  or  1. TRUE
 */

function parsePipeTable(line: string): [number, string][] {
  const results: [number, string][] = [];
  const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
  if (cells.length >= 2) {
    const num = parseInt(cells[0]);
    if (!isNaN(num)) {
      results.push([num, cells[1]]);
    }
  }
  return results;
}

function parseMultiSelectAnswer(answer: string): string[] {
  // "AE" -> ["A", "E"], "A, E" -> ["A", "E"], "A/E" -> ["A", "E"]
  const cleaned = answer.replace(/[\s,/]+/g, "");
  if (/^[A-G]{2,}$/.test(cleaned)) {
    return cleaned.split("");
  }
  return [answer.trim()];
}

function isRangeQuestion(key: string): { start: number; end: number } | null {
  const match = key.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (match) {
    return { start: parseInt(match[1]), end: parseInt(match[2]) };
  }
  return null;
}

export function parseAnswerBlock(text: string): AnswerMap {
  const answers: AnswerMap = new Map();
  if (!text) return answers;

  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip header lines
    if (/^(Listening|Reading|Writing|Speaking|Answer|Test|Section)/i.test(trimmed)) continue;
    if (/^Part\s+\d+,?\s*Questions?\s/i.test(trimmed)) continue;
    if (/^[-=|]+$/.test(trimmed)) continue;

    // Pipe table format: | 1 | F |
    if (trimmed.includes("|")) {
      const results = parsePipeTable(trimmed);
      for (const [num, ans] of results) {
        answers.set(num, ans);
      }
      continue;
    }

    // Try multiple entries per line: "1 TRUE  2 FALSE  3 NOT GIVEN"
    // Or: "14, C 15, G 16, B"
    // Or: "11.A 12. B 13.C"

    // Pattern for range questions like "17-18.AE" or "17-18. A, E"
    const rangePattern = /(\d+)\s*[-–]\s*(\d+)\s*[.,]?\s*([A-G][\s,/]*[A-G]*(?:\s*[A-G])*)/g;
    let rangeMatch;
    let hadRange = false;
    while ((rangeMatch = rangePattern.exec(trimmed)) !== null) {
      hadRange = true;
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      const answerPart = rangeMatch[3];
      const multiAnswers = parseMultiSelectAnswer(answerPart);

      // Store the same multi-select answer for both question numbers
      for (let q = start; q <= end; q++) {
        answers.set(q, multiAnswers);
      }
    }
    if (hadRange) continue;

    // Pattern for single entries: "1. TRUE" or "1, TRUE" or "1 TRUE" or "1.A"
    const singlePattern = /(\d+)\s*[.,):]?\s+([A-Za-z][\w\s'-/]*?)(?=\s+\d+\s*[.,):]?\s|$)/g;
    let singleMatch;
    let hadSingle = false;
    while ((singleMatch = singlePattern.exec(trimmed)) !== null) {
      hadSingle = true;
      const num = parseInt(singleMatch[1]);
      const ans = singleMatch[2].trim();
      if (num > 0 && num <= 40 && ans) {
        answers.set(num, ans);
      }
    }
    if (hadSingle) continue;

    // Fallback: simple "1. answer" or "1 answer"
    const simpleMatch = trimmed.match(/^(\d+)\s*[.,):]?\s*(.+)$/);
    if (simpleMatch) {
      const num = parseInt(simpleMatch[1]);
      const ans = simpleMatch[2].trim();
      if (num > 0 && num <= 40 && ans) {
        answers.set(num, ans);
      }
    }
  }

  return answers;
}

export function splitListeningReadingAnswers(
  answerBlock: string
): { listening: AnswerMap; reading: AnswerMap } {
  const upper = answerBlock.toUpperCase();

  const listeningStart = upper.indexOf("LISTENING");
  const readingStart = upper.indexOf("READING");

  let listeningText = "";
  let readingText = "";

  if (listeningStart !== -1 && readingStart !== -1) {
    if (listeningStart < readingStart) {
      listeningText = answerBlock.slice(listeningStart, readingStart);
      readingText = answerBlock.slice(readingStart);
    } else {
      readingText = answerBlock.slice(readingStart, listeningStart);
      listeningText = answerBlock.slice(listeningStart);
    }
  } else if (listeningStart !== -1) {
    listeningText = answerBlock.slice(listeningStart);
  } else if (readingStart !== -1) {
    readingText = answerBlock.slice(readingStart);
  } else {
    // No clear markers — try to parse everything as one block
    return {
      listening: parseAnswerBlock(answerBlock),
      reading: new Map(),
    };
  }

  return {
    listening: parseAnswerBlock(listeningText),
    reading: parseAnswerBlock(readingText),
  };
}
