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

4. For completion types, preserve the full template text with blank markers like (7), (8), etc.

5. For passages with lettered sections (A, B, C...), split into passageSections array with label and text.

6. Extract wordLimit from instructions: "ONE WORD ONLY", "ONE WORD AND/OR A NUMBER", "NO MORE THAN TWO WORDS", etc.

7. Set allowRepeat: true when instructions say "You may use any letter more than once."

8. For matchingOptions, use objects with letter and text fields: [{"letter": "A", "text": "Matt Elliot"}, ...]

9. Respond with ONLY valid JSON. No markdown, no explanation, no backticks wrapping.`;

async function callClaude(userPrompt: string): Promise<string> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: PARSER_SYSTEM_PROMPT,
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

export async function parseReadingSections(
  rawMarkdown: string,
  answers: AnswerMap,
  bookNumber: number,
  testNumber: number
): Promise<IReadingSection[]> {
  const prompt = `Parse the following IELTS Reading section into a JSON array of ReadingSection objects.

Book number: ${bookNumber}
Test number: ${testNumber}

Each passage should have:
- passageNumber (1, 2, or 3)
- title (the passage title)
- subtitle (if present)
- passage (full text)
- passageSections (if passage has labeled sections A, B, C, etc.)
- topic (classify: nature, science, history, psychology, education, environment, health, technology, etc.)
- difficulty ("beginner" for passage 1, "intermediate" for passage 2, "advanced" for passage 3)
- totalQuestions (count of questions in this passage)
- questionGroups (array of question group objects)
- footnotes (any footnotes at bottom)

Question Group interface:
{
  groupLabel: string,
  questionType: QuestionType enum value (e.g. "TRUE_FALSE_NOT_GIVEN", "NOTE_COMPLETION"),
  instructions: string,
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

ANSWER KEY:
${answersToString(answers)}

RAW MARKDOWN:
${rawMarkdown}`;

  const response = await callClaude(prompt);
  const sections = parseJSON<IReadingSection[]>(response);

  // Ensure bookNumber/testNumber are set
  return sections.map((s, i) => ({
    ...s,
    bookNumber,
    testNumber,
    passageNumber: s.passageNumber || i + 1,
  }));
}

export async function parseListeningSections(
  rawMarkdown: string,
  answers: AnswerMap,
  bookNumber: number,
  testNumber: number
): Promise<IListeningSection[]> {
  const prompt = `Parse the following IELTS Listening section into a JSON array of ListeningSection objects.

Book number: ${bookNumber}
Test number: ${testNumber}

Each part should have:
- partNumber (1, 2, 3, or 4)
- title (descriptive title for this part)
- context (brief description of the conversation/monologue context)
- totalQuestions (count of questions in this part)
- questionGroups (array of question group objects, same interface as Reading)

Standard IELTS Listening structure:
- Part 1: Questions 1-10 (conversation, everyday context)
- Part 2: Questions 11-20 (monologue, everyday context)
- Part 3: Questions 21-30 (conversation, academic context)
- Part 4: Questions 31-40 (monologue, academic context)

ANSWER KEY:
${answersToString(answers)}

RAW MARKDOWN:
${rawMarkdown}`;

  const response = await callClaude(prompt);
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
