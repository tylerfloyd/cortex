import { Queue } from 'bullmq';
import { redisConnection } from './connection';
import type {
  ExtractionJobData,
  AIProcessingJobData,
  EmbeddingJobData,
  MarkdownExportJobData,
} from './types';

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000,
  },
};

export const extractionQueue = new Queue<ExtractionJobData>('content-extraction', {
  connection: redisConnection,
  defaultJobOptions,
});

export const aiProcessingQueue = new Queue<AIProcessingJobData>('ai-processing', {
  connection: redisConnection,
  defaultJobOptions,
});

export const embeddingQueue = new Queue<EmbeddingJobData>('embedding', {
  connection: redisConnection,
  defaultJobOptions,
});

export const markdownExportQueue = new Queue<MarkdownExportJobData>('markdown-export', {
  connection: redisConnection,
  defaultJobOptions,
});
