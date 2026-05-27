import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AssignmentModel } from '../models/Assignment';
import { addGenerationJob } from '../config/queue';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';
import { broadcastMessage } from '../ws/socketManager';

export const assignmentRouter = Router();

// Validation schema
const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  subject: z.string().min(1, 'Subject is required').max(100),
  className: z.string().min(1, 'Class is required').max(50),
  topic: z.string().optional().default(''),
  dueDate: z.string().min(1, 'Due date is required'),
  questionTypes: z.array(z.object({
    type: z.string().min(1),
    count: z.number().int().min(1, 'At least 1 question required'),
    marks: z.number().int().min(1, 'Marks must be at least 1'),
  })).min(1, 'At least one question type is required'),
  additionalInstructions: z.string().optional().default(''),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
});

// POST /api/assignments — Create a new assignment and queue generation
assignmentRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createAssignmentSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const assignment = await AssignmentModel.create({
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
      status: 'queued',
    });

    // Add job to BullMQ queue
    const jobId = await addGenerationJob(assignment._id.toString());
    if (jobId) {
      assignment.jobId = jobId;
      await assignment.save();
    }

    // Notify clients via WebSocket
    broadcastMessage({
      type: 'job_queued',
      assignmentId: assignment._id.toString(),
      data: { message: 'Assignment queued for generation' },
    });

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error: any) {
    console.error('Create assignment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/assignments — List all assignments
assignmentRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, sort = '-createdAt' } = req.query;

    const filter: Record<string, unknown> = {};
    if (status && typeof status === 'string') {
      filter.status = status;
    }
    if (search && typeof search === 'string') {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const assignments = await AssignmentModel
      .find(filter)
      .sort(String(sort))
      .select('-generatedPaper') // Don't send full paper in list
      .lean();

    res.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error('List assignments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/assignments/:id — Get single assignment with generated paper
assignmentRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Try cache first
    const cached = await cacheGet(`assignment:${id}`);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const assignment = await AssignmentModel.findById(id).lean();
    if (!assignment) {
      res.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }

    // Cache if completed
    if (assignment.status === 'completed') {
      await cacheSet(`assignment:${id}`, JSON.stringify(assignment));
    }

    res.json({ success: true, data: assignment });
  } catch (error: any) {
    console.error('Get assignment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/assignments/:id — Delete assignment
assignmentRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assignment = await AssignmentModel.findByIdAndDelete(id);

    if (!assignment) {
      res.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }

    // Clear cache
    await cacheDel(`assignment:${id}`);

    res.json({ success: true, data: { message: 'Assignment deleted' } });
  } catch (error: any) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/assignments/:id/regenerate — Regenerate the paper
assignmentRouter.post('/:id/regenerate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assignment = await AssignmentModel.findById(id);

    if (!assignment) {
      res.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }

    // Reset status
    assignment.status = 'queued';
    assignment.generatedPaper = undefined;
    assignment.errorMessage = undefined;
    await assignment.save();

    // Clear cache
    await cacheDel(`assignment:${id}`);

    // Re-queue
    const jobId = await addGenerationJob(String(id));
    if (jobId) {
      assignment.jobId = jobId;
      await assignment.save();
    }

    broadcastMessage({
      type: 'job_queued',
      assignmentId: id,
      data: { message: 'Regeneration queued' },
    });

    res.json({ success: true, data: assignment });
  } catch (error: any) {
    console.error('Regenerate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
