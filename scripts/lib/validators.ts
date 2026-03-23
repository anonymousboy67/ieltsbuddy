import { QuestionType } from "../../src/types/ielts";
import type {
  IReadingSection,
  IListeningSection,
  IWritingTask,
  ISpeakingPart,
  IQuestionGroup,
} from "../../src/types/ielts";

const validQuestionTypes = new Set(Object.values(QuestionType));

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateQuestionGroup(group: IQuestionGroup, label: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!group.questionType || !validQuestionTypes.has(group.questionType as QuestionType)) {
    errors.push(`${label}: invalid questionType "${group.questionType}"`);
  }

  if (!group.instructions) {
    warnings.push(`${label}: missing instructions`);
  }

  if (group.startQuestion == null || group.endQuestion == null) {
    errors.push(`${label}: missing startQuestion or endQuestion`);
  } else if (group.startQuestion > group.endQuestion) {
    errors.push(`${label}: startQuestion (${group.startQuestion}) > endQuestion (${group.endQuestion})`);
  }

  if (!group.questions || group.questions.length === 0) {
    errors.push(`${label}: no questions`);
  } else {
    const expectedCount = group.endQuestion - group.startQuestion + 1;
    if (group.questions.length !== expectedCount) {
      warnings.push(
        `${label}: expected ${expectedCount} questions (${group.startQuestion}-${group.endQuestion}), got ${group.questions.length}`
      );
    }

    for (const q of group.questions) {
      if (q.questionNumber == null) {
        errors.push(`${label}: question missing questionNumber`);
      }
      if (q.correctAnswer == null || q.correctAnswer === "") {
        warnings.push(`${label} Q${q.questionNumber}: missing correctAnswer`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateReadingSection(section: IReadingSection): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const label = `Reading B${section.bookNumber}T${section.testNumber}P${section.passageNumber}`;

  if (!section.bookNumber) errors.push(`${label}: missing bookNumber`);
  if (!section.testNumber) errors.push(`${label}: missing testNumber`);
  if (!section.passageNumber) errors.push(`${label}: missing passageNumber`);
  if (!section.title) errors.push(`${label}: missing title`);
  if (!section.passage) errors.push(`${label}: missing passage`);
  if (!section.totalQuestions) warnings.push(`${label}: missing totalQuestions`);

  if (section.questionGroups) {
    for (let i = 0; i < section.questionGroups.length; i++) {
      const groupResult = validateQuestionGroup(
        section.questionGroups[i],
        `${label} Group ${i + 1}`
      );
      errors.push(...groupResult.errors);
      warnings.push(...groupResult.warnings);
    }

    // Check question number continuity
    const allNums = section.questionGroups
      .flatMap((g) => g.questions.map((q) => q.questionNumber))
      .sort((a, b) => a - b);

    if (allNums.length > 0) {
      const computedTotal = allNums.length;
      if (section.totalQuestions && section.totalQuestions !== computedTotal) {
        warnings.push(
          `${label}: totalQuestions (${section.totalQuestions}) doesn't match actual count (${computedTotal})`
        );
      }
    }
  } else {
    errors.push(`${label}: no questionGroups`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateListeningSection(section: IListeningSection): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const label = `Listening B${section.bookNumber}T${section.testNumber}P${section.partNumber}`;

  if (!section.bookNumber) errors.push(`${label}: missing bookNumber`);
  if (!section.testNumber) errors.push(`${label}: missing testNumber`);
  if (!section.partNumber) errors.push(`${label}: missing partNumber`);
  if (!section.totalQuestions) warnings.push(`${label}: missing totalQuestions`);

  if (section.questionGroups) {
    for (let i = 0; i < section.questionGroups.length; i++) {
      const groupResult = validateQuestionGroup(
        section.questionGroups[i],
        `${label} Group ${i + 1}`
      );
      errors.push(...groupResult.errors);
      warnings.push(...groupResult.warnings);
    }
  } else {
    errors.push(`${label}: no questionGroups`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateWritingTask(task: IWritingTask): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const label = `Writing B${task.bookNumber}T${task.testNumber}Task${task.taskNumber}`;

  if (!task.bookNumber) errors.push(`${label}: missing bookNumber`);
  if (!task.testNumber) errors.push(`${label}: missing testNumber`);
  if (!task.taskNumber) errors.push(`${label}: missing taskNumber`);
  if (!task.taskType) errors.push(`${label}: missing taskType`);
  if (!task.prompt) errors.push(`${label}: missing prompt`);
  if (!task.instructions) warnings.push(`${label}: missing instructions`);
  if (!task.minWords) warnings.push(`${label}: missing minWords`);

  return { valid: errors.length === 0, errors, warnings };
}

export function validateSpeakingPart(part: ISpeakingPart): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const label = `Speaking B${part.bookNumber}T${part.testNumber}Part${part.partNumber}`;

  if (!part.bookNumber) errors.push(`${label}: missing bookNumber`);
  if (!part.testNumber) errors.push(`${label}: missing testNumber`);
  if (!part.partNumber) errors.push(`${label}: missing partNumber`);
  if (!part.partType) errors.push(`${label}: missing partType`);

  if (part.partType === "CUE_CARD" && (!part.cueCardPrompts || part.cueCardPrompts.length === 0)) {
    warnings.push(`${label}: CUE_CARD type but no cueCardPrompts`);
  }

  if ((!part.questions || part.questions.length === 0) && part.partType !== "CUE_CARD") {
    warnings.push(`${label}: no questions`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function printValidation(result: ValidationResult, sectionLabel: string): void {
  if (result.errors.length > 0) {
    console.error(`  ERRORS in ${sectionLabel}:`);
    for (const err of result.errors) {
      console.error(`    - ${err}`);
    }
  }
  if (result.warnings.length > 0) {
    console.warn(`  WARNINGS in ${sectionLabel}:`);
    for (const warn of result.warnings) {
      console.warn(`    - ${warn}`);
    }
  }
  if (result.valid && result.warnings.length === 0) {
    console.log(`  ${sectionLabel}: valid`);
  }
}
