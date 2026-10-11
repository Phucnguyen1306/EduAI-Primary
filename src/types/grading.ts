export type GradeLevel = "Lớp 3" | "Lớp 4" | "Lớp 5";

export type PracticeFileType = "docx" | "pptx" | "sb3" | "theory";

export interface ChecklistItem {
  id: string;
  criterion: string;
  technicalTarget: string;
  maxPoints: number;
  commonElementaryMistake: string;
}

export type CognitiveLevel = "Nhận biết" | "Thông hiểu" | "Vận dụng";

export interface MultipleChoiceQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
  cognitiveLevel?: CognitiveLevel;
  illustrationNote?: string; // [HÌNH ẢNH MINH HỌA: Mô tả chi tiết hình ảnh cần có]
  illustrationImageDataUrl?: string; // Ảnh minh họa do giáo viên chèn (nếu có)
}

export interface ShortAnswerQuestion {
  id: string;
  question: string;
  sampleAnswer: string;
  semanticKeywords: string[];
  points: number;
  cognitiveLevel?: CognitiveLevel;
  illustrationNote?: string;
  gradingGuide?: string;
}

export interface SemesterPracticeTask {
  id: string;
  title: string;
  cognitiveLevel: CognitiveLevel;
  softwareType: "Word (.docx)" | "PowerPoint (.pptx)" | "Scratch (.sb3)" | "Thực hành tổng hợp";
  instructions: string;
  illustrationNote?: string;
  points: number;
  gradingRubric: string;
}

export interface SemesterExamBlueprint {
  isSemesterExam: boolean;
  semesterType: "Học kỳ I" | "Học kỳ II" | "Giữa Học kỳ I" | "Giữa Học kỳ II";
  schoolYear: string;
  theoryPercent: number;
  practicePercent: number;
  nhanBietPercent: number;
  thongHieuPercent: number;
  vanDungPercent: number;
  practiceTasks: SemesterPracticeTask[];
  answerKeyAndGradingGuide: string;
}

export interface TheoryExam {
  id: string;
  title: string;
  grade: GradeLevel;
  durationMinutes: number;
  multipleChoice: MultipleChoiceQuestion[];
  shortAnswer: ShortAnswerQuestion;
  shortAnswers?: ShortAnswerQuestion[];
  semesterBlueprint?: SemesterExamBlueprint;
}

export interface Assignment {
  id: string;
  code: string;
  title: string;
  grade: GradeLevel;
  className: string;
  fileType: PracticeFileType;
  studentPrompt: string;
  standardFileNamePattern: string;
  checklist: ChecklistItem[];
  theoryExam?: TheoryExam;
  isSemesterExam?: boolean;
  templateSummary?: {
    headingText: string;
    bodyLines: string[];
    requiredFont?: string;
    requiredSizePt?: number;
    requiredColorHex?: string;
    scratchBlocksRequired?: string[];
    slideCountRequired?: number;
  };
}

export interface ScratchSimulationStep {
  stepIndex: number;
  blockOpcode: string;
  blockLabel: string;
  x: number;
  y: number;
  direction: number;
  soundPlayed?: string;
  sayText?: string;
  penDown: boolean;
  hitEdge?: boolean;
}

export interface DocxInspectionData {
  engine: "DOM Parsing & Layout Analysis (.docx)";
  paperSize: string;
  detectedFonts: string[];
  titleFontSizePt: number;
  titleColorHex: string;
  titleBold: boolean;
  titleAlignment: "left" | "center" | "right" | "justify";
  paragraphCount: number;
  extractedLines: {
    lineNumber: number;
    text: string;
    startsWithUppercase: boolean;
    alignment: string;
    fontSizePt: number;
    isBold: boolean;
    colorHex: string;
  }[];
  imageCount: number;
  imageAlignedCenter: boolean;
  tableCount: number;
}

export interface PptxInspectionData {
  engine: "Slide Property & Multimedia Scanner (.pptx)";
  slideCount: number;
  slides: {
    slideNumber: number;
    layoutName: string;
    titleText: string;
    hasBackgroundFill: boolean;
    imageCount: number;
    audioCount: number;
    videoCount: number;
    hasTransition: boolean;
    transitionType?: string;
    animationCount: number;
  }[];
}

export interface Sb3InspectionData {
  engine: "AST (Abstract Syntax Tree) & Sandbox Simulator (.sb3)";
  spriteCount: number;
  totalBlocks: number;
  hasWhenFlagClicked: boolean;
  hasRepeatLoop: boolean;
  repeatCountValue: number;
  manualRepeatedMoveCount: number;
  hasSoundBlock: boolean;
  astBlocks: {
    id: string;
    opcode: string;
    label: string;
    category: "event" | "control" | "motion" | "looks" | "sound";
    depth: number;
    warning?: string;
  }[];
  simulationTrajectory: ScratchSimulationStep[];
  formsClosedSquare: boolean;
  soundTriggeredOnTime: boolean;
}

export interface StudentMcqAnswerDetail {
  questionId: string;
  question: string;
  options: string[];
  selectedIndex: number;
  correctIndex: number;
  earnedPoints: number;
  maxPoints: number;
  illustrationNote?: string;
}

export interface TheoryInspectionData {
  engine: "Auto-MCQ & NLP Semantic Short-Answer Engine";
  mcqCorrectCount: number;
  mcqTotalCount: number;
  mcqScore: number;
  shortAnswerQuestion: string;
  studentShortAnswer: string;
  matchedSemanticConcepts: string[];
  nlpSimilarityScore: number;
  nlpExplanation: string;
  mcqDetails?: StudentMcqAnswerDetail[];
  shortAnswerDetails?: {
    questionId: string;
    question: string;
    studentAnswer: string;
    earnedPoints: number;
    maxPoints: number;
    matchedKeywords: string[];
  }[];
}

export type ExtractedInspection =
  | { type: "docx"; data: DocxInspectionData }
  | { type: "pptx"; data: PptxInspectionData }
  | { type: "sb3"; data: Sb3InspectionData }
  | { type: "theory"; data: TheoryInspectionData };

export interface CriterionEvaluation {
  criterion: string;
  passed: boolean;
  earnedPoints: number;
  maxPoints: number;
  detailNote: string;
}

export type ApprovalStatus = "pending" | "approved" | "adjusted";

export interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  grade: GradeLevel;
  assignmentId: string;
  assignmentTitle: string;
  fileType: PracticeFileType;
  originalFileName: string;
  standardizedFileName: string;
  wasFileNameAutoFixed: boolean;
  submittedAt: string;
  processingTimeSec: number;
  aiScore: number;
  finalScore: number;
  approvalStatus: ApprovalStatus;
  needsAttention: boolean;
  detectedErrors: string[];
  criterionBreakdown: CriterionEvaluation[];
  personalizedFeedback: string;
  inspection: ExtractedInspection;
  mcqDetails?: StudentMcqAnswerDetail[];
  driveFileId?: string;
  driveWebViewLink?: string;
  driveAssignmentFolderId?: string;
  driveAssignmentFolderName?: string;
  driveAssignmentFolderLink?: string;
  driveRootFolderUrl?: string;
  driveSynced?: boolean;
  practiceWorkImageDataUrl?: string;
  practiceOriginalFileName?: string;
}

