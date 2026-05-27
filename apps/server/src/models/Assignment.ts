import mongoose, { Document, Schema } from 'mongoose';

// Sub-schemas
const questionTypeSchema = new Schema({
  type: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marks: { type: Number, required: true, min: 1 },
}, { _id: false });

const questionSchema = new Schema({
  number: { type: Number, required: true },
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'], required: true },
  marks: { type: Number, required: true },
  options: [String],
  answer: String,
}, { _id: false });

const sectionSchema = new Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  instruction: { type: String, default: '' },
  questions: [questionSchema],
}, { _id: false });

const answerKeyItemSchema = new Schema({
  questionNumber: { type: Number, required: true },
  answer: { type: String, required: true },
}, { _id: false });

const generatedPaperSchema = new Schema({
  schoolName: { type: String, default: 'Delhi Public School' },
  subject: String,
  className: String,
  timeAllowed: String,
  maxMarks: Number,
  generalInstructions: [String],
  sections: [sectionSchema],
  answerKey: [answerKeyItemSchema],
}, { _id: false });

// Main Assignment Schema
export interface IAssignment extends Document {
  title: string;
  subject: string;
  className: string;
  topic: string;
  dueDate: Date;
  questionTypes: { type: string; count: number; marks: number }[];
  additionalInstructions: string;
  fileUrl?: string;
  fileName?: string;
  status: 'draft' | 'queued' | 'generating' | 'completed' | 'failed';
  generatedPaper?: typeof generatedPaperSchema;
  errorMessage?: string;
  jobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    topic: { type: String, default: '', trim: true },
    dueDate: { type: Date, required: true },
    questionTypes: { type: [questionTypeSchema], required: true },
    additionalInstructions: { type: String, default: '' },
    fileUrl: String,
    fileName: String,
    status: {
      type: String,
      enum: ['draft', 'queued', 'generating', 'completed', 'failed'],
      default: 'queued',
    },
    generatedPaper: generatedPaperSchema,
    errorMessage: String,
    jobId: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ createdAt: -1 });
assignmentSchema.index({ title: 'text', subject: 'text' });

export const AssignmentModel = mongoose.model<IAssignment>('Assignment', assignmentSchema);
