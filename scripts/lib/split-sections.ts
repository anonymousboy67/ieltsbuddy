export interface TestChunk {
  testNumber: number;
  raw: string;
  listening: string;
  reading: string;
  writing: string;
  speaking: string;
  answerBlock: string;
}

function findSectionBoundary(
  content: string,
  sectionName: string,
  startFrom: number = 0
): number {
  const patterns = [
    new RegExp(`^#{1,3}\\s*${sectionName}\\b`, "im"),
    new RegExp(`^${sectionName}\\s*$`, "im"),
    new RegExp(`^\\*\\*${sectionName}\\*\\*`, "im"),
  ];
  for (const pat of patterns) {
    const match = pat.exec(content.slice(startFrom));
    if (match) return startFrom + match.index;
  }
  return -1;
}

function extractBetween(
  content: string,
  startMarkers: string[],
  endMarkers: string[]
): string {
  let start = -1;
  for (const marker of startMarkers) {
    start = findSectionBoundary(content, marker);
    if (start !== -1) break;
  }
  if (start === -1) return "";

  let end = content.length;
  for (const marker of endMarkers) {
    const pos = findSectionBoundary(content, marker, start + 50);
    if (pos !== -1 && pos < end) {
      end = pos;
    }
  }
  return content.slice(start, end).trim();
}

/**
 * Detect and extract a trailing "answer keys" section that contains answers
 * for ALL tests in one block (common in Books 15-19). Returns the section
 * text and the index where it starts, or null if not found.
 */
function extractTrailingAnswerKeys(content: string): {
  answerSection: string;
  startIndex: number;
} | null {
  // Look for a combined answer keys heading
  const patterns = [
    /(?:^|\n)(#{1,3}\s*Listening\s+and\s+Reading\s+answer\s+keys?\b)/im,
    /(?:^|\n)(#{1,3}\s*Answer\s+Keys?\s*$)/im,
  ];

  for (const pat of patterns) {
    const match = pat.exec(content);
    if (match) {
      const startIndex = match.index + (match[0].startsWith("\n") ? 1 : 0);
      let answerSection = content.slice(startIndex);

      // Trim off any trailing "Sample Writing answers" section
      const writingCutoff = /(?:^|\n)#{1,3}\s*Sample\s+Writing/im.exec(answerSection);
      if (writingCutoff) {
        answerSection = answerSection.slice(0, writingCutoff.index);
      }

      return { answerSection, startIndex };
    }
  }
  return null;
}

/**
 * Split a trailing answer keys section into per-test answer blocks.
 * The section alternates between LISTENING and READING sub-sections,
 * with each pair belonging to one test (in order).
 */
function splitAnswerKeysByTest(
  answerSection: string,
  testCount: number
): Map<number, string> {
  const result = new Map<number, string>();

  // Find only standalone ## LISTENING and ## READING headings.
  // Exclude "Listening and Reading answer keys" (the section title)
  // and "Reading Passage N" sub-headings.
  const sectionPattern =
    /(?:^|\n)#{1,3}\s*(LISTENING|READING)[\t ]*(?:\n|$)/gim;

  const boundaries: { index: number; type: string }[] = [];
  let m;
  while ((m = sectionPattern.exec(answerSection)) !== null) {
    boundaries.push({
      index: m.index,
      type: m[1].toUpperCase(),
    });
  }

  if (boundaries.length === 0) return result;

  // Group into pairs: each test has one LISTENING + one READING section
  // They come in order: L1, R1, L2, R2, L3, R3, L4, R4
  let testNum = 1;
  let currentTestText = "";

  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i].index;
    const end =
      i + 1 < boundaries.length
        ? boundaries[i + 1].index
        : answerSection.length;
    const sectionText = answerSection.slice(start, end);
    const sectionType = boundaries[i].type;

    if (sectionType === "LISTENING") {
      // Start of a new test's answers
      if (currentTestText) {
        // Save previous test
        result.set(testNum, currentTestText);
        testNum++;
      }
      currentTestText = sectionText;
    } else {
      // READING — append to current test
      currentTestText += "\n" + sectionText;
    }
  }

  // Save last test
  if (currentTestText) {
    result.set(testNum, currentTestText);
  }

  return result;
}

export function splitIntoTests(content: string): { testNumber: number; content: string }[] {
  // Match real test boundaries: lines that are ONLY a test heading.
  // Avoids matching "Test 1" in page headers/footers/running text.
  // Valid patterns:
  //   ## Test 1           (markdown heading)
  //   **Test 1**          (bold standalone)
  //   Test 1              (standalone line, nothing else)
  //   # TEST 1            (uppercase heading)
  const testPattern = /(?:^|\n)\s*#{0,3}\s*(?:\*\*)?Test\s+(\d+)(?:\*\*)?[\t ]*(?:\n|$)/gi;
  const rawMatches: { index: number; testNumber: number }[] = [];
  let match;

  while ((match = testPattern.exec(content)) !== null) {
    rawMatches.push({ index: match.index, testNumber: parseInt(match[1]) });
  }

  if (rawMatches.length === 0) {
    return [{ testNumber: 1, content }];
  }

  // Deduplicate: keep only the FIRST occurrence of each test number.
  // Later occurrences are page headers/footers repeating "Test 1" etc.
  const seen = new Set<number>();
  const matches: { index: number; testNumber: number }[] = [];
  for (const m of rawMatches) {
    if (!seen.has(m.testNumber)) {
      seen.add(m.testNumber);
      matches.push(m);
    }
  }

  // Sort by position in file (should already be sorted, but be safe)
  matches.sort((a, b) => a.index - b.index);

  // Detect trailing answer keys section BEFORE slicing into tests.
  // This section contains answers for ALL tests and should be excluded
  // from individual test content, then distributed to each test separately.
  const trailing = extractTrailingAnswerKeys(content);
  const contentEnd = trailing ? trailing.startIndex : content.length;

  const tests: { testNumber: number; content: string }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length
      ? Math.min(matches[i + 1].index, contentEnd)
      : contentEnd;
    tests.push({
      testNumber: matches[i].testNumber,
      content: content.slice(start, end),
    });
  }

  // If there was a trailing answer keys section, split it and append
  // the relevant answer block to each test's content.
  if (trailing) {
    const answersByTest = splitAnswerKeysByTest(
      trailing.answerSection,
      tests.length
    );

    for (const t of tests) {
      const answerBlock = answersByTest.get(t.testNumber);
      if (answerBlock) {
        // Append with a clear marker so splitTestSections can find it
        t.content += "\n\n## Answer Key\n\n" + answerBlock;
      }
    }
  }

  return tests;
}

export function splitTestSections(testContent: string, testNumber: number): TestChunk {
  const listening = extractBetween(
    testContent,
    ["LISTENING"],
    ["READING", "WRITING"]
  );

  const reading = extractBetween(
    testContent,
    ["READING"],
    ["WRITING", "SPEAKING"]
  );

  const writing = extractBetween(
    testContent,
    ["WRITING"],
    ["SPEAKING"]
  );

  let speaking = extractBetween(
    testContent,
    ["SPEAKING"],
    ["Answer", "ANSWER", "KEY"]
  );

  // Fallback: In some books (e.g. Book 19), speaking questions appear as
  // "## PART 1" / "## PART 2" / "## PART 3" after the Writing section,
  // without a "## SPEAKING" heading. The "## SPEAKING" heading may appear
  // as a stray footer AFTER the actual questions.
  // Detect this by checking if the speaking section is too short (< 300 chars)
  // and looking for "## PART 1" + examiner-style content after Writing.
  if (speaking.length < 300) {
    const writingEnd = findSectionBoundary(testContent, "WRITING");
    if (writingEnd !== -1) {
      // Look for "## PART 1" after the writing section
      const afterWriting = testContent.slice(writingEnd);
      const partOneMatch = /\n##\s+PART\s+1\b/i.exec(afterWriting);
      if (partOneMatch) {
        const speakingStart = writingEnd + partOneMatch.index;
        // End at "## SPEAKING" footer, answer block, or end of content
        const speakingHeaderPos = findSectionBoundary(testContent, "SPEAKING", speakingStart + 50);
        const answerPos = findSectionBoundary(testContent, "Answer", speakingStart + 50);
        let speakingEnd = testContent.length;
        if (speakingHeaderPos !== -1 && speakingHeaderPos < speakingEnd) speakingEnd = speakingHeaderPos;
        if (answerPos !== -1 && answerPos < speakingEnd) speakingEnd = answerPos;
        const candidate = testContent.slice(speakingStart, speakingEnd).trim();
        // Only use if it looks like speaking content (has examiner/describe/discuss keywords)
        if (candidate.length > 200 && /examiner|Describe|Discussion/i.test(candidate)) {
          speaking = candidate;
        }
      }
    }
  }

  // Extract answer block — look for "Answer Key" (injected by splitIntoTests)
  // or the original "Answer"/"ANSWER" patterns
  const answerPatterns = [
    /(?:^|\n)#{0,3}\s*(?:\*\*)?(?:Answer\s*Key)(?:\*\*)?/i,
    /(?:^|\n)#{0,3}\s*(?:\*\*)?(?:Answer|ANSWER)s?\s*(?:Key|KEY)?(?:\*\*)?/i,
  ];
  let answerBlock = "";
  for (const pat of answerPatterns) {
    const match = pat.exec(testContent);
    if (match) {
      answerBlock = testContent.slice(match.index).trim();
      break;
    }
  }

  return {
    testNumber,
    raw: testContent,
    listening,
    reading,
    writing,
    speaking,
    answerBlock,
  };
}

export function splitMarkdown(content: string): TestChunk[] {
  const tests = splitIntoTests(content);
  return tests.map((t) => splitTestSections(t.content, t.testNumber));
}
