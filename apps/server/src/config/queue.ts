import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { processGenerationJob } from '../workers/generatePaper';

let queue: Queue | null = null;

export function initializeQueue(): void {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  queue = new Queue('paper-generation', { connection });

  // Create worker
  const workerConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  const worker = new Worker(
    'paper-generation',
    async (job: Job) => {
      return processGenerationJob(job);
    },
    {
      connection: workerConnection,
      concurrency: 2,
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed for assignment ${job.data.assignmentId}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });
}

export function getQueue(): Queue | null {
  return queue;
}

export async function addGenerationJob(assignmentId: string): Promise<string | undefined> {
  if (!queue) {
    console.error('Queue not initialized');
    return undefined;
  }

  const job = await queue.add(
    'generate-paper',
    { assignmentId },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    }
  );

  return job.id;
}
