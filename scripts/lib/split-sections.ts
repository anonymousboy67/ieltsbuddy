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

  const tests: { testNumber: number; content: string }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
    tests.push({
      testNumber: matches[i].testNumber,
      content: content.slice(start, end),
    });
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

  const speaking = extractBetween(
    testContent,
    ["SPEAKING"],
    ["Answer", "ANSWER", "KEY"]
  );

  // Extract answer block
  const answerPatterns = [
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
