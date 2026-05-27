import { create } from 'zustand';

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
  status: 'draft' | 'queued' | 'generating' | 'completed' | 'failed';
  generatedPaper?: GeneratedPaper;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export type Difficulty = 'Easy' | 'Moderate' | 'Hard';

export interface Question {
  number: number;
  text: string;
  difficulty: Difficulty;
  marks: number;
  options?: string[];
  answer?: string;
}

export interface Section {
  title: string;
  subtitle: string;
  instruction: string;
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

export interface FormData {
  title: string;
  subject: string;
  className: string;
  topic: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  fileUrl?: string;
  fileName?: string;
}

const defaultFormData: FormData = {
  title: '',
  subject: '',
  className: '',
  topic: '',
  dueDate: '',
  questionTypes: [{ type: 'MCQ', count: 5, marks: 1 }],
  additionalInstructions: '',
};

interface AssignmentStore {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  formData: FormData;
  isLoading: boolean;
  generationStatus: { assignmentId: string; progress: number; message: string } | null;
  searchQuery: string;

  setAssignments: (assignments: Assignment[]) => void;
  setCurrentAssignment: (assignment: Assignment | null) => void;
  updateFormData: (data: Partial<FormData>) => void;
  resetForm: () => void;
  setLoading: (loading: boolean) => void;
  setGenerationStatus: (status: { assignmentId: string; progress: number; message: string } | null) => void;
  setSearchQuery: (query: string) => void;
  addQuestionType: () => void;
  removeQuestionType: (index: number) => void;
  updateQuestionType: (index: number, data: Partial<QuestionTypeConfig>) => void;
  fetchAssignments: () => Promise<void>;
  createAssignment: () => Promise<string | null>;
  deleteAssignment: (id: string) => Promise<boolean>;
  fetchAssignment: (id: string) => Promise<void>;
  regenerateAssignment: (id: string) => Promise<void>;
  updateAssignmentStatus: (id: string, status: Assignment['status']) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  currentAssignment: null,
  formData: { ...defaultFormData },
  isLoading: false,
  generationStatus: null,
  searchQuery: '',

  setAssignments: (assignments) => set({ assignments }),
  setCurrentAssignment: (assignment) => set({ currentAssignment: assignment }),
  updateFormData: (data) => set((s) => ({ formData: { ...s.formData, ...data } })),
  resetForm: () => set({ formData: { ...defaultFormData } }),
  setLoading: (isLoading) => set({ isLoading }),
  setGenerationStatus: (generationStatus) => set({ generationStatus }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  addQuestionType: () => set((s) => ({
    formData: {
      ...s.formData,
      questionTypes: [...s.formData.questionTypes, { type: 'Short Answer', count: 3, marks: 2 }],
    },
  })),

  removeQuestionType: (index) => set((s) => ({
    formData: {
      ...s.formData,
      questionTypes: s.formData.questionTypes.filter((_, i) => i !== index),
    },
  })),

  updateQuestionType: (index, data) => set((s) => ({
    formData: {
      ...s.formData,
      questionTypes: s.formData.questionTypes.map((qt, i) =>
        i === index ? { ...qt, ...data } : qt
      ),
    },
  })),

  fetchAssignments: async () => {
    set({ isLoading: true });
    try {
      const query = get().searchQuery;
      const url = query
        ? `${API_BASE}/api/assignments?search=${encodeURIComponent(query)}`
        : `${API_BASE}/api/assignments`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) set({ assignments: json.data });
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createAssignment: async () => {
    const { formData } = get();
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        set((s) => ({ assignments: [json.data, ...s.assignments] }));
        return json.data._id;
      }
      return null;
    } catch (err) {
      console.error('Failed to create assignment:', err);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAssignment: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/assignments/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        set((s) => ({ assignments: s.assignments.filter((a) => a._id !== id) }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  fetchAssignment: async (id) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/api/assignments/${id}`);
      const json = await res.json();
      if (json.success) set({ currentAssignment: json.data });
    } catch (err) {
      console.error('Failed to fetch assignment:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  regenerateAssignment: async (id) => {
    try {
      await fetch(`${API_BASE}/api/assignments/${id}/regenerate`, { method: 'POST' });
      set({ generationStatus: { assignmentId: id, progress: 0, message: 'Queued for regeneration...' } });
    } catch (err) {
      console.error('Failed to regenerate:', err);
    }
  },

  updateAssignmentStatus: (id, status) => set((s) => ({
    assignments: s.assignments.map((a) => a._id === id ? { ...a, status } : a),
    currentAssignment: s.currentAssignment?._id === id ? { ...s.currentAssignment, status } : s.currentAssignment,
  })),
}));
