#!/usr/bin/env npx tsx
import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Parse a Docling-extracted IELTS markdown file into structured MongoDB documents.
 *
 * Usage:
 *   npx tsx scripts/parse-ielts-md.ts <markdown_file> [book_number]
 *
 * Examples:
 *   npx tsx scripts/parse-ielts-md.ts extracted_book_20.md 20
 *   npx tsx scripts/parse-ielts-md.ts extracted_book_20.md         # auto-detects book number
 *
 * Options:
 *   --dry-run     Parse and validate without inserting into MongoDB
 *   --json        Output parsed JSON to files instead of MongoDB
 *   --sections    Comma-separated list of sections to parse: listening,reading,writing,speaking
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { splitMarkdown } from "./lib/split-sections";
import { splitListeningReadingAnswers } from "./lib/parse-answers";
import {
  parseReadingSections,
  parseListeningSections,
  parseWritingTasks,
  parseSpeakingParts,
} from "./lib/claude-parser";
import {
  validateReadingSection,
  validateListeningSection,
  validateWritingTask,
  validateSpeakingPart,
  printValidation,
} from "./lib/validators";

// Import models — use relative paths since we're in scripts/
// We need to register models before using them
async function getModels() {
  const ReadingSection = (await import("../src/models/ReadingSection")).default;
  const ListeningSection = (await import("../src/models/ListeningSection")).default;
  const WritingTask = (await import("../src/models/WritingTask")).default;
  const SpeakingPart = (await import("../src/models/SpeakingPart")).default;
  const Test = (await import("../src/models/Test")).default;
  return { ReadingSection, ListeningSection, WritingTask, SpeakingPart, Test };
}

function detectBookNumber(content: string): number | null {
  // Look for patterns like "IELTS 20", "Cambridge IELTS 15", "Book 20"
  const patterns = [
    /IELTS\s+(\d+)/i,
    /Book\s+(\d+)/i,
    /Cambridge\s+(\d+)/i,
  ];
  for (const pat of patterns) {
    const match = pat.exec(content.slice(0, 2000));
    if (match) return parseInt(match[1]);
  }
  return null;
}

interface ParseOptions {
  dryRun: boolean;
  jsonOutput: boolean;
  sections: Set<string>;
}

function parseArgs(): { filePath: string; bookNumber: number | null; options: ParseOptions } {
  const args = process.argv.slice(2);
  const options: ParseOptions = {
    dryRun: false,
    jsonOutput: false,
    sections: new Set(["listening", "reading", "writing", "speaking"]),
  };

  const positional: string[] = [];

  for (const arg of args) {
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--json") {
      options.jsonOutput = true;
    } else if (arg.startsWith("--sections=")) {
      options.sections = new Set(arg.slice("--sections=".length).split(","));
    } else {
      positional.push(arg);
    }
  }

  if (positional.length < 1) {
    console.error(
      "Usage: npx tsx scripts/parse-ielts-md.ts <markdown_file> [book_number] [--dry-run] [--json] [--sections=reading,writing]"
    );
    process.exit(1);
  }

  return {
    filePath: positional[0],
    bookNumber: positional[1] ? parseInt(positional[1]) : null,
    options,
  };
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is required");
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB\n");
}

async function main() {
  const { filePath, bookNumber: argBookNumber, options } = parseArgs();

  // Read file
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  console.log(`Loaded ${content.length} characters from ${filePath}`);

  // Detect book number
  const bookNumber = argBookNumber ?? detectBookNumber(content);
  if (!bookNumber) {
    console.error("Could not detect book number. Please provide it as the second argument.");
    process.exit(1);
  }
  console.log(`Book number: ${bookNumber}`);

  // Split into tests
  const testChunks = splitMarkdown(content);
  console.log(`Found ${testChunks.length} test(s)\n`);

  // Connect to DB if needed
  if (!options.dryRun && !options.jsonOutput) {
    await connectDB();
  }

  const models = !options.dryRun && !options.jsonOutput ? await getModels() : null;

  for (const chunk of testChunks) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Processing Test ${chunk.testNumber}`);
    console.log(`${"=".repeat(60)}`);

    // Parse answers from answer block
    const { listening: listeningAnswers, reading: readingAnswers } =
      splitListeningReadingAnswers(chunk.answerBlock);

    console.log(
      `  Answer key: ${listeningAnswers.size} listening, ${readingAnswers.size} reading answers`
    );

    const sectionIds: {
      listening: string[];
      reading: string[];
      writing: string[];
      speaking: string[];
    } = { listening: [], reading: [], writing: [], speaking: [] };

    // Parse Reading
    if (options.sections.has("reading") && chunk.reading) {
      console.log("\n--- Reading ---");
      try {
        const sections = await parseReadingSections(
          chunk.reading,
          readingAnswers,
          bookNumber,
          chunk.testNumber
        );
        console.log(`  Parsed ${sections.length} passage(s)`);

        for (const section of sections) {
          const result = validateReadingSection(section);
          printValidation(result, `Passage ${section.passageNumber}: ${section.title}`);

          if (models && result.valid) {
            const doc = await models.ReadingSection.findOneAndUpdate(
              {
                bookNumber: section.bookNumber,
                testNumber: section.testNumber,
                passageNumber: section.passageNumber,
              },
              section,
              { upsert: true, new: true }
            );
            sectionIds.reading.push(doc._id.toString());
            console.log(`  Saved to DB: ${doc._id}`);
          }
        }

        if (options.jsonOutput) {
          const outPath = path.join(
            path.dirname(filePath),
            `reading_b${bookNumber}_t${chunk.testNumber}.json`
          );
          fs.writeFileSync(outPath, JSON.stringify(sections, null, 2));
          console.log(`  Written to ${outPath}`);
        }
      } catch (err) {
        console.error(`  Error parsing reading:`, (err as Error).message);
      }
    }

    // Parse Listening
    if (options.sections.has("listening") && chunk.listening) {
      console.log("\n--- Listening ---");
      try {
        const sections = await parseListeningSections(
          chunk.listening,
          listeningAnswers,
          bookNumber,
          chunk.testNumber
        );
        console.log(`  Parsed ${sections.length} part(s)`);

        for (const section of sections) {
          const result = validateListeningSection(section);
          printValidation(result, `Part ${section.partNumber}: ${section.title || "Untitled"}`);

          if (models && result.valid) {
            const doc = await models.ListeningSection.findOneAndUpdate(
              {
                bookNumber: section.bookNumber,
                testNumber: section.testNumber,
                partNumber: section.partNumber,
              },
              section,
              { upsert: true, new: true }
            );
            sectionIds.listening.push(doc._id.toString());
            console.log(`  Saved to DB: ${doc._id}`);
          }
        }

        if (options.jsonOutput) {
          const outPath = path.join(
            path.dirname(filePath),
            `listening_b${bookNumber}_t${chunk.testNumber}.json`
          );
          fs.writeFileSync(outPath, JSON.stringify(sections, null, 2));
          console.log(`  Written to ${outPath}`);
        }
      } catch (err) {
        console.error(`  Error parsing listening:`, (err as Error).message);
      }
    }

    // Parse Writing
    if (options.sections.has("writing") && chunk.writing) {
      console.log("\n--- Writing ---");
      try {
        const tasks = await parseWritingTasks(
          chunk.writing,
          bookNumber,
          chunk.testNumber
        );
        console.log(`  Parsed ${tasks.length} task(s)`);

        for (const task of tasks) {
          const result = validateWritingTask(task);
          printValidation(result, `Task ${task.taskNumber}`);

          if (models && result.valid) {
            const doc = await models.WritingTask.findOneAndUpdate(
              {
                bookNumber: task.bookNumber,
                testNumber: task.testNumber,
                taskNumber: task.taskNumber,
              },
              task,
              { upsert: true, new: true }
            );
            sectionIds.writing.push(doc._id.toString());
            console.log(`  Saved to DB: ${doc._id}`);
          }
        }

        if (options.jsonOutput) {
          const outPath = path.join(
            path.dirname(filePath),
            `writing_b${bookNumber}_t${chunk.testNumber}.json`
          );
          fs.writeFileSync(outPath, JSON.stringify(tasks, null, 2));
          console.log(`  Written to ${outPath}`);
        }
      } catch (err) {
        console.error(`  Error parsing writing:`, (err as Error).message);
      }
    }

    // Parse Speaking
    if (options.sections.has("speaking") && chunk.speaking) {
      console.log("\n--- Speaking ---");
      try {
        const parts = await parseSpeakingParts(
          chunk.speaking,
          bookNumber,
          chunk.testNumber
        );
        console.log(`  Parsed ${parts.length} part(s)`);

        for (const part of parts) {
          const result = validateSpeakingPart(part);
          printValidation(result, `Part ${part.partNumber}: ${part.topic || "Untitled"}`);

          if (models && result.valid) {
            const doc = await models.SpeakingPart.findOneAndUpdate(
              {
                bookNumber: part.bookNumber,
                testNumber: part.testNumber,
                partNumber: part.partNumber,
              },
              part,
              { upsert: true, new: true }
            );
            sectionIds.speaking.push(doc._id.toString());
            console.log(`  Saved to DB: ${doc._id}`);
          }
        }

        if (options.jsonOutput) {
          const outPath = path.join(
            path.dirname(filePath),
            `speaking_b${bookNumber}_t${chunk.testNumber}.json`
          );
          fs.writeFileSync(outPath, JSON.stringify(parts, null, 2));
          console.log(`  Written to ${outPath}`);
        }
      } catch (err) {
        console.error(`  Error parsing speaking:`, (err as Error).message);
      }
    }

    // Create/update Test container
    if (models) {
      try {
        const testDoc = await models.Test.findOneAndUpdate(
          { bookNumber, testNumber: chunk.testNumber },
          {
            bookNumber,
            testNumber: chunk.testNumber,
            bookTitle: `IELTS ${bookNumber} Academic`,
            ...(sectionIds.listening.length > 0 && { listening: sectionIds.listening }),
            ...(sectionIds.reading.length > 0 && { reading: sectionIds.reading }),
            ...(sectionIds.writing.length > 0 && { writing: sectionIds.writing }),
            ...(sectionIds.speaking.length > 0 && { speaking: sectionIds.speaking }),
            isComplete:
              sectionIds.listening.length > 0 &&
              sectionIds.reading.length > 0 &&
              sectionIds.writing.length > 0 &&
              sectionIds.speaking.length > 0,
          },
          { upsert: true, new: true }
        );
        console.log(`\n  Test container: ${testDoc._id} (complete: ${testDoc.isComplete})`);
      } catch (err) {
        console.error(`  Error creating Test container:`, (err as Error).message);
      }
    }
  }

  // Disconnect
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
