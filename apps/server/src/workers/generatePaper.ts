import { Job } from 'bullmq';
import { AssignmentModel } from '../models/Assignment';
import { generatePaper } from '../services/aiService';
import { cacheSet } from '../config/redis';
import { broadcastMessage } from '../ws/socketManager';
import fs from 'fs';
import path from 'path';

// Dynamically import pdf-parse to handle ESM/CJS issues
async function extractPdfText(filePath: string): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.warn('Failed to parse PDF:', error);
    return '';
  }
}

async function extractTextFile(filePath: string): Promise<string> {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

export async function processGenerationJob(job: Job): Promise<void> {
  const { assignmentId } = job.data;

  console.log(`🔄 Processing generation job for assignment: ${assignmentId}`);

  try {
    // Update status to generating
    const assignment = await AssignmentModel.findById(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    assignment.status = 'generating';
    await assignment.save();

    // Notify frontend
    broadcastMessage({
      type: 'job_started',
      assignmentId,
      data: { message: 'Generating question paper...', progress: 10 },
    });

    // Extract file content if uploaded
    let fileContent = '';
    if (assignment.fileUrl) {
      const filePath = path.join(process.cwd(), assignment.fileUrl);
      const ext = path.extname(filePath).toLowerCase();

      broadcastMessage({
        type: 'job_progress',
        assignmentId,
        data: { message: 'Reading uploaded document...', progress: 20 },
      });

      if (ext === '.pdf') {
        fileContent = await extractPdfText(filePath);
      } else if (ext === '.txt') {
        fileContent = await extractTextFile(filePath);
      }
    }

    // Progress update
    broadcastMessage({
      type: 'job_progress',
      assignmentId,
      data: { message: 'Generating questions...', progress: 40 },
    });

    // Generate paper using AI
    const paper = await generatePaper({
      title: assignment.title,
      subject: assignment.subject,
      className: assignment.className,
      topic: assignment.topic,
      questionTypes: assignment.questionTypes.map((qt) => ({
        type: qt.type as any,
        count: qt.count,
        marks: qt.marks,
      })),
      additionalInstructions: assignment.additionalInstructions,
      fileContent: fileContent || undefined,
    });

    // Progress update
    broadcastMessage({
      type: 'job_progress',
      assignmentId,
      data: { message: 'Saving results...', progress: 80 },
    });

    // Save to MongoDB
    assignment.generatedPaper = paper as any;
    assignment.status = 'completed';
    assignment.errorMessage = undefined;
    await assignment.save();

    // Cache the result
    const assignmentData = assignment.toObject();
    await cacheSet(`assignment:${assignmentId}`, JSON.stringify(assignmentData));

    // Notify completion
    broadcastMessage({
      type: 'job_completed',
      assignmentId,
      data: {
        message: 'Question paper generated successfully!',
        progress: 100,
      },
    });

    console.log(`✅ Paper generated for assignment: ${assignmentId}`);
  } catch (error: any) {
    console.error(`❌ Generation failed for ${assignmentId}:`, error.message);

    // Update assignment status
    await AssignmentModel.findByIdAndUpdate(assignmentId, {
      status: 'failed',
      errorMessage: error.message,
    });

    // Notify failure
    broadcastMessage({
      type: 'job_failed',
      assignmentId,
      data: {
        message: 'Failed to generate question paper',
        error: error.message,
      },
    });

    throw error; // Let BullMQ handle retry
  }
}
