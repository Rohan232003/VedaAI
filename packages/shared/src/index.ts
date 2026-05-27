// ============================================================
// VedaAI — Shared Types
// ============================================================

// --- Assignment ---

export type QuestionTypeName =
  | 'MCQ'
  | 'Short Answer'
  | 'Long Answer'
  | 'True/False'
  | 'Fill in the Blanks'
  | 'Match the Following'
  | 'Case Study'
  | 'Assertion & Reason';

export interface QuestionTypeConfig {
  type: QuestionTypeName;
  count: number;
  marks: number;
}

export type AssignmentStatus =
  | 'draft'
  | 'queued'
  | 'generating'
  | 'completed'
  | 'failed';

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  className: string;
  topic: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  fileUrl?: string;
  fileName?: string;
  status: AssignmentStatus;
  generatedPaper?: GeneratedPaper;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Generated Paper ---

export type Difficulty = 'Easy' | 'Moderate' | 'Hard';

export interface Question {
  number: number;
  text: string;
  difficulty: Difficulty;
  marks: number;
  options?: string[];       // for MCQ
  answer?: string;
}

export interface Section {
  title: string;            // e.g. "Section A"
  subtitle: string;         // e.g. "Multiple Choice Questions"
  instruction: string;      // e.g. "Attempt all questions"
  questions: Question[];
}

export interface GeneratedPaper {
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  generalInstructions: string[];
  sections: Section[];
  answerKey: { questionNumber: number; answer: string }[];
}

// --- WebSocket Messages ---

export type WSMessageType =
  | 'job_queued'
  | 'job_started'
  | 'job_progress'
  | 'job_completed'
  | 'job_failed';

export interface WSMessage {
  type: WSMessageType;
  assignmentId: string;
  data?: {
    progress?: number;
    message?: string;
    paper?: GeneratedPaper;
    error?: string;
  };
}

// --- API Request / Response ---

export interface CreateAssignmentRequest {
  title: string;
  subject: string;
  className: string;
  topic: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
