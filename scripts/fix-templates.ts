#!/usr/bin/env npx tsx
/**
 * Normalize completion templates in MongoDB to use (N) ...... format.
 *
 * Usage:
 *   npx tsx scripts/fix-templates.ts              # dry-run (default)
 *   npx tsx scripts/fix-templates.ts --apply      # write changes to DB
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";

const APPLY = process.argv.includes("--apply");

/**
 * Normalize a completion template so every blank uses (N) ...... format.
 *
 * Handles these patterns found in extracted books:
 *   "31 __________"  -> "(31) ......"
 *   "31___"          -> "(31) ......"
 *   "31 ...."        -> "(31) ......"
 *   "31 ."           -> "(31) ......"  (if in question range)
 *   "(31) ___"       -> "(31) ......"  (already parenthesized but wrong filler)
 *   "(31)"           -> "(31) ......"  (parenthesized but no filler)
 *
 * Does NOT touch numbers that aren't question blanks (e.g. "Area: 1 hectares").
 * Uses the startQuestion-endQuestion range to identify which numbers are blanks.
 */
function normalizeTemplate(
  template: string,
  startQ: number,
  endQ: number
): string {
  if (!template) return template;

  const qNums = new Set<number>();
  for (let i = startQ; i <= endQ; i++) qNums.add(i);

  let result = template;

  // Pass 1: Fix already-parenthesized markers with wrong filler
  // (31) ___ or (31)___ or (31) or (31)...... -> (N) ......
  result = result.replace(
    /\((\d+)\)\s*[_.]{0,20}/g,
    (match, numStr) => {
      const num = parseInt(numStr);
      if (qNums.has(num)) return `(${num}) ......`;
      return match; // not a question number, leave alone
    }
  );

  // Pass 2: Fix bare numbers followed by underscores/dots
  // "31 __________" or "31___" or "31 ...." or "31..."
  // Must be at a word boundary (not part of a larger number or word)
  result = result.replace(
    /(?<![(\d])(\d{1,2})\s*[_.]{2,}/g,
    (match, numStr) => {
      const num = parseInt(numStr);
      if (qNums.has(num)) return `(${num}) ......`;
      return match;
    }
  );

  // Pass 3: Fix bare numbers followed by single dot + space (e.g. "3 . about")
  // Excludes numbers that are part of a thousands separator (e.g. "11,700")
  result = result.replace(
    /(?<![(\d])(\d{1,2})\s+\.(?=\s)/g,
    (match, numStr) => {
      const num = parseInt(numStr);
      if (qNums.has(num)) return `(${num}) ......`;
      return match;
    }
  );

  // Pass 4: Fix bare numbers at end of line (e.g. "the park's 5\n")
  result = result.replace(
    /(\s)(\d{1,2})(\s*(?:\n|$))/g,
    (match, before, numStr, after, offset) => {
      const num = parseInt(numStr);
      if (!qNums.has(num)) return match;
      // Skip thousands separator: check char after the number
      const charAfterNum = result[offset + before.length + numStr.length];
      if (charAfterNum === "," && /^\d/.test(result[offset + before.length + numStr.length + 1] || "")) return match;
      return `${before}(${num}) ......${after}`;
    }
  );

  // Pass 5: Fix remaining bare numbers preceded by whitespace/colon
  // e.g. "Adults, such as 10, free" or "Cost per child: 9 E"
  // Exclude: thousands separators (10,000), ranges (2-4), already converted
  result = result.replace(
    /(?<=[\s:])(\d{1,2})(?=[\s,])/g,
    (match, numStr, offset) => {
      const num = parseInt(numStr);
      if (!qNums.has(num)) return match;
      // Skip if already parenthesized elsewhere
      if (result.includes(`(${num})`)) return match;
      // Skip thousands separator: number followed by ,digits (e.g. "11,700")
      const afterComma = result.slice(offset + numStr.length, offset + numStr.length + 4);
      if (/^,\d{3}/.test(afterComma)) return match;
      return `(${num}) ......`;
    }
  );

  return result;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log(`Connected to MongoDB (${APPLY ? "APPLY" : "DRY-RUN"} mode)\n`);

  const db = mongoose.connection.db!;
  const collections = ["listeningsections", "readingsections"];
  let totalChanges = 0;

  for (const collName of collections) {
    const coll = db.collection(collName);
    const docs = await coll
      .find({ "questionGroups.completionTemplate": { $exists: true, $ne: "" } })
      .toArray();

    console.log(`=== ${collName} (${docs.length} docs with templates) ===\n`);

    for (const doc of docs) {
      const label =
        collName === "listeningsections"
          ? `B${doc.bookNumber} T${doc.testNumber} P${doc.partNumber}`
          : `B${doc.bookNumber} T${doc.testNumber} P${doc.passageNumber}`;

      let docChanged = false;
      const updatedGroups = doc.questionGroups.map((g: any) => {
        if (!g.completionTemplate) return g;

        const original = g.completionTemplate;
        const normalized = normalizeTemplate(original, g.startQuestion, g.endQuestion);

        if (normalized !== original) {
          docChanged = true;
          totalChanges++;

          console.log(`${label} Q${g.startQuestion}-${g.endQuestion} [${g.questionType}]`);

          // Show diff: find lines that changed
          const origLines = original.split("\n");
          const normLines = normalized.split("\n");
          const maxLines = Math.max(origLines.length, normLines.length);
          for (let i = 0; i < maxLines; i++) {
            if (origLines[i] !== normLines[i]) {
              console.log(`  - ${(origLines[i] || "").slice(0, 80)}`);
              console.log(`  + ${(normLines[i] || "").slice(0, 80)}`);
            }
          }
          console.log();

          return { ...g, completionTemplate: normalized };
        }
        return g;
      });

      if (docChanged && APPLY) {
        await coll.updateOne(
          { _id: doc._id },
          { $set: { questionGroups: updatedGroups } }
        );
      }
    }
  }

  console.log(`\nTotal templates changed: ${totalChanges}`);
  if (!APPLY && totalChanges > 0) {
    console.log("Run with --apply to write changes to DB.");
  }
  if (APPLY) {
    console.log("Changes written to DB.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
