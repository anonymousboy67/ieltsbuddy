export enum QuestionType {
  NOTE_COMPLETION = "NOTE_COMPLETION",
  SUMMARY_COMPLETION = "SUMMARY_COMPLETION",
  SENTENCE_COMPLETION = "SENTENCE_COMPLETION",
  TABLE_COMPLETION = "TABLE_COMPLETION",
  FORM_COMPLETION = "FORM_COMPLETION",
  FLOW_CHART_COMPLETION = "FLOW_CHART_COMPLETION",
  DIAGRAM_LABELLING = "DIAGRAM_LABELLING",
  MAP_LABELLING = "MAP_LABELLING",
  SHORT_ANSWER = "SHORT_ANSWER",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  MULTIPLE_SELECT = "MULTIPLE_SELECT",
  TRUE_FALSE_NOT_GIVEN = "TRUE_FALSE_NOT_GIVEN",
  YES_NO_NOT_GIVEN = "YES_NO_NOT_GIVEN",
  MATCHING_HEADINGS = "MATCHING_HEADINGS",
  MATCHING_INFORMATION = "MATCHING_INFORMATION",
  MATCHING_FEATURES = "MATCHING_FEATURES",
  MATCHING_SENTENCE_ENDINGS = "MATCHING_SENTENCE_ENDINGS",
}

export enum WritingTaskType {
  DESCRIBE_VISUAL = "DESCRIBE_VISUAL",
  ESSAY = "ESSAY",
}

export enum VisualType {
  LINE_GRAPH = "LINE_GRAPH",
  BAR_CHART = "BAR_CHART",
  PIE_CHART = "PIE_CHART",
  TABLE = "TABLE",
  PROCESS_DIAGRAM = "PROCESS_DIAGRAM",
  MAP = "MAP",
  MIXED = "MIXED",
}

export enum SpeakingPartType {
  INTERVIEW = "INTERVIEW",
  CUE_CARD = "CUE_CARD",
  DISCUSSION = "DISCUSSION",
}

export interface IQuestion {
  questionNumber: number;
  questionText?: string;
  options?: string[];
  correctAnswer: string | string[];
}

export interface IMatchingOption {
  letter: string;
  text: string;
}

export interface ITableData {
  headers: string[];
  rows: unknown[];
}

export interface IQuestionGroup {
  groupLabel: string;
  questionType: QuestionType;
  instructions: string;
  wordLimit?: string;
  startQuestion: number;
  endQuestion: number;
  matchingOptions?: IMatchingOption[];
  completionTemplate?: string;
  tableData?: ITableData;
  wordBank?: string[];
  imageUrl?: string;
  sectionLabels?: string[];
  allowRepeat?: boolean;
  questions: IQuestion[];
}

export interface IPassageSection {
  label: string;
  text: string;
}

export interface IReadingSection {
  bookNumber: number;
  testNumber: number;
  passageNumber: number;
  title: string;
  subtitle?: string;
  passage: string;
  passageSections?: IPassageSection[];
  topic?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  totalQuestions: number;
  questionGroups: IQuestionGroup[];
  footnotes?: string[];
}

export interface IListeningSection {
  bookNumber: number;
  testNumber: number;
  partNumber: number;
  title?: string;
  audioUrl?: string;
  transcript?: string;
  context?: string;
  totalQuestions: number;
  questionGroups: IQuestionGroup[];
}

export interface IWritingTableData {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface ISampleAnswer {
  bandScore?: number;
  essay?: string;
  examinerComments?: string;
  criteriaBreakdown?: {
    taskAchievement?: string;
    coherenceCohesion?: string;
    lexicalResource?: string;
    grammaticalRange?: string;
  };
}

export interface IWritingTask {
  bookNumber: number;
  testNumber: number;
  taskNumber: number;
  taskType: WritingTaskType;
  prompt: string;
  instructions: string;
  minWords: number;
  timeRecommended: number;
  visualType?: VisualType;
  imageUrl?: string;
  tableData?: IWritingTableData[];
  sampleAnswers?: ISampleAnswer[];
}

export interface ISpeakingQuestion {
  questionNumber: number;
  questionText: string;
}

export interface ISpeakingSampleAnswer {
  questionNumber?: number;
  answerText: string;
}

export interface ISpeakingPart {
  bookNumber: number;
  testNumber: number;
  partNumber: number;
  partType: SpeakingPartType;
  topic?: string;
  instructions?: string;
  questions?: ISpeakingQuestion[];
  cueCardPrompts?: string[];
  cueCardFinalPrompt?: string;
  prepTime?: number;
  speakTime?: number;
  sampleAnswers?: ISpeakingSampleAnswer[];
}

export interface ITest {
  bookNumber: number;
  testNumber: number;
  bookTitle?: string;
  listening: string[];
  reading: string[];
  writing: string[];
  speaking: string[];
  isComplete: boolean;
}

export interface IUserAttemptAnswer {
  questionNumber: number;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
}

export interface IUserAttempt {
  userId: string;
  sectionType: "listening" | "reading" | "writing" | "speaking";
  sectionId: string;
  sectionModel: "ListeningSection" | "ReadingSection" | "WritingTask" | "SpeakingPart";
  bookNumber?: number;
  testNumber?: number;
  answers?: IUserAttemptAnswer[];
  correctCount?: number;
  totalQuestions?: number;
  bandScore?: number;
  writingResponse?: string;
  writingFeedback?: {
    bandScore: number;
    taskAchievement: { score: number; feedback: string };
    coherenceCohesion: { score: number; feedback: string };
    lexicalResource: { score: number; feedback: string };
    grammaticalRange: { score: number; feedback: string };
    overallFeedback: string;
  };
  speakingResponses?: {
    partNumber: number;
    questionNumber?: number;
    audioUrl?: string;
    transcript?: string;
  }[];
  speakingFeedback?: {
    bandScore: number;
    fluencyCoherence: { score: number; feedback: string };
    lexicalResource: { score: number; feedback: string };
    grammaticalRange: { score: number; feedback: string };
    pronunciation: { score: number; feedback: string };
    overallFeedback: string;
  };
  timeSpent?: number;
  completedAt?: Date;
  mode?: "practice" | "timed" | "review";
}
