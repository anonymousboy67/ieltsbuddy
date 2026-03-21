// Run with: npx tsx scripts/extract-with-ai.ts extracted_book_20.md 20

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const API_BASE = "http://localhost:3000/api/admin";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function extractWithAI(rawContent: string, bookNumber: number) {
  const chunks = splitIntoTestSections(rawContent);

  console.log(`Found ${chunks.length} test sections\n`);

  for (let i = 0; i < chunks.length; i++) {
    const testNumber = i + 1;
    console.log(`\n--- Processing Test ${testNumber} ---\n`);

    await extractWriting(chunks[i], bookNumber, testNumber);
    await extractReading(chunks[i], bookNumber, testNumber);
    await extractSpeaking(chunks[i], bookNumber, testNumber);
  }
}

function splitIntoTestSections(content: string): string[] {
  const sections: string[] = [];
  const testMarkers = content.split(/(?=Test\s+\d)/i);

  let currentTest = "";
  let testNum = 0;

  for (const part of testMarkers) {
    if (/^Test\s+\d/i.test(part)) {
      if (currentTest) sections.push(currentTest);
      currentTest = part;
      testNum++;
      if (testNum > 4) break;
    } else {
      currentTest += part;
    }
  }
  if (currentTest) sections.push(currentTest);

  return sections.slice(0, 4);
}

function parseJSON(raw: string): unknown {
  let text = raw.trim();

  // Strip code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // Try direct parse
  try {
    return JSON.parse(text);
  } catch {
    // Extract between braces/brackets
    const braceMatch = text.match(/[\[{][\s\S]*[\]}]/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {
        // Fix newlines inside strings
        const fixed = braceMatch[0].replace(/"([^"]*)"/g, (_m, v: string) => {
          return `"${v.replace(/\n/g, "\\n").replace(/\r/g, "\\r")}"`;
        });
        return JSON.parse(fixed);
      }
    }
    throw new Error("Failed to parse JSON from AI response");
  }
}

async function extractWriting(
  testContent: string,
  bookNumber: number,
  testNumber: number
) {
  if (!testContent.toUpperCase().includes("WRITING")) return;

  const writingStart = testContent.toUpperCase().indexOf("WRITING");
  const writingContent = testContent.substring(
    writingStart,
    writingStart + 3000
  );

  try {
    const response = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      system: `You are an IELTS content extractor. Extract writing tasks from the provided text and return ONLY valid JSON array. No markdown, no explanation. Each task should have: taskType ("task1" or "task2"), title (short descriptive title, max 60 chars), instructions (the full task prompt the student needs to respond to, clean and properly formatted). Remove any page numbers, copyright notices, headers, markdown syntax like ## or **. If a task mentions a chart/graph/map/diagram, note it in the instructions but we will handle the image separately.`,
      messages: [
        {
          role: "user",
          content: `Extract all IELTS writing tasks from this text. Book ${bookNumber}, Test ${testNumber}:\n\n${writingContent}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const tasks = parseJSON(text) as Array<{
      taskType: string;
      title: string;
      instructions: string;
    }>;

    for (const task of tasks) {
      const data = {
        bookNumber,
        testNumber,
        taskType: task.taskType,
        title: task.title,
        instructions: task.instructions,
        imageUrl: "",
        sampleAnswer: "",
      };

      const res = await fetch(`${API_BASE}/writing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        console.log(
          `  Saved Writing ${task.taskType}: ${task.title.substring(0, 50)}...`
        );
      } else {
        console.log(`  Error saving writing task: ${res.status}`);
      }
    }
  } catch (err) {
    console.log(
      `  Error extracting writing for Test ${testNumber}:`,
      (err as Error).message
    );
  }
}

async function extractReading(
  testContent: string,
  bookNumber: number,
  testNumber: number
) {
  if (
    !testContent.toUpperCase().includes("READING") &&
    !testContent.toUpperCase().includes("PASSAGE")
  )
    return;

  const upperContent = testContent.toUpperCase();

  for (let partNum = 1; partNum <= 3; partNum++) {
    const startMarker = `PASSAGE ${partNum}`;
    const endMarker = partNum < 3 ? `PASSAGE ${partNum + 1}` : "WRITING";

    const start = upperContent.indexOf(startMarker);
    if (start === -1) continue;

    let end = upperContent.indexOf(endMarker, start + 100);
    if (end === -1) end = start + 8000;

    const passageContent = testContent.substring(
      start,
      Math.min(end, start + 8000)
    );

    try {
      const response = await client.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 4000,
        system: `You are an IELTS content extractor. Extract the reading passage and its questions. Return ONLY valid JSON with NO markdown. Structure:
{
  "title": "passage title (clean, no markdown ## symbols)",
  "topic": "topic category like Nature, History, Science, Technology, Education, Environment, Health, etc.",
  "passage": "the full passage text, clean and properly formatted with proper paragraphs separated by newlines. Remove page numbers, copyright notices, URLs, markdown syntax",
  "questions": [
    {
      "questionNumber": 1,
      "questionType": "true-false-not-given" or "yes-no-not-given" or "multiple-choice" or "matching-headings" or "sentence-completion" or "short-answer" or "summary-completion" or "matching-information",
      "questionText": "the question text",
      "options": ["A option", "B option"] (only for multiple choice, otherwise empty array),
      "correctAnswer": "the answer if visible in the text, otherwise empty string"
    }
  ]
}
Remove ALL markdown formatting (##, **, etc), page numbers, copyright lines, URLs. Clean the text to be readable.`,
        messages: [
          {
            role: "user",
            content: `Extract the IELTS Reading Passage ${partNum} and ALL its questions from this text. Book ${bookNumber}, Test ${testNumber}:\n\n${passageContent}`,
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";
      const passage = parseJSON(text) as {
        title: string;
        topic?: string;
        passage: string;
        questions?: Array<{
          questionNumber: number;
          questionType: string;
          questionText: string;
          options?: string[];
          correctAnswer: string;
        }>;
      };

      const difficultyMap: Record<number, string> = {
        1: "beginner",
        2: "intermediate",
        3: "advanced",
      };

      const data = {
        bookNumber,
        testNumber,
        partNumber: partNum,
        title: passage.title,
        topic: passage.topic || "General",
        difficulty: difficultyMap[partNum] || "intermediate",
        passage: passage.passage,
        questions: passage.questions || [],
      };

      const res = await fetch(`${API_BASE}/reading`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        console.log(
          `  Saved Reading Passage ${partNum}: ${passage.title?.substring(0, 50)}... (${passage.questions?.length || 0} questions)`
        );
      } else {
        console.log(`  Error saving reading passage: ${res.status}`);
      }
    } catch (err) {
      console.log(
        `  Error extracting reading passage ${partNum}:`,
        (err as Error).message
      );
    }
  }
}

async function extractSpeaking(
  testContent: string,
  bookNumber: number,
  testNumber: number
) {
  if (!testContent.toUpperCase().includes("SPEAKING")) return;

  const speakingStart = testContent.toUpperCase().indexOf("SPEAKING");
  const speakingContent = testContent.substring(
    speakingStart,
    speakingStart + 3000
  );

  try {
    const response = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      system: `You are an IELTS content extractor. Extract speaking questions for all 3 parts. Return ONLY valid JSON array with NO markdown:
[
  {
    "partNumber": 1,
    "questions": ["question 1", "question 2", "question 3", "question 4"],
    "topicCard": ""
  },
  {
    "partNumber": 2,
    "questions": ["Describe a..."],
    "topicCard": "You should say: what it is, where it is, how you found out about it, and explain why you like it"
  },
  {
    "partNumber": 3,
    "questions": ["question 1", "question 2", "question 3"]
  }
]
If only some parts are found, return only those. Remove markdown, page numbers, copyright lines.`,
      messages: [
        {
          role: "user",
          content: `Extract IELTS Speaking questions from this text. Book ${bookNumber}, Test ${testNumber}:\n\n${speakingContent}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parts = parseJSON(text) as Array<{
      partNumber: number;
      questions: string[];
      topicCard?: string;
    }>;

    for (const part of parts) {
      const data = {
        bookNumber,
        testNumber,
        partNumber: part.partNumber,
        questions: part.questions,
        topicCard: part.topicCard || "",
      };

      const res = await fetch(`${API_BASE}/speaking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        console.log(
          `  Saved Speaking Part ${part.partNumber}: ${part.questions.length} questions`
        );
      } else {
        console.log(`  Error saving speaking: ${res.status}`);
      }
    }
  } catch (err) {
    console.log(
      `  Error extracting speaking:`,
      (err as Error).message
    );
  }
}

// Main
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log(
    "Usage: npx tsx scripts/extract-with-ai.ts <markdown_file> <book_number>"
  );
  console.log(
    "Example: npx tsx scripts/extract-with-ai.ts extracted_book_20.md 20"
  );
  process.exit(1);
}

const filePath = args[0];
const bookNumber = parseInt(args[1]);

console.log(`\nIELTS AI Extractor - Book ${bookNumber}`);
console.log("=".repeat(50));

const content = fs.readFileSync(filePath, "utf-8");
console.log(`Loaded ${content.length} characters from ${filePath}\n`);

extractWithAI(content, bookNumber)
  .then(() => {
    console.log("\nExtraction complete!");
  })
  .catch((err) => {
    console.error("Fatal error:", err);
  });
