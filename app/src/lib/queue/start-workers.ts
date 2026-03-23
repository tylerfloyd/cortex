import {
  extractionWorker,
  aiProcessingWorker,
  embeddingWorker,
  markdownExportWorker,
} from './workers';
import { startMarkdownSync } from '@/lib/export/sync';

const workers = [
  extractionWorker,
  aiProcessingWorker,
  embeddingWorker,
  markdownExportWorker,
];

// Log worker lifecycle events
for (const worker of workers) {
  worker.on('active', (job) => {
    console.log(`[worker:${worker.name}] Job ${job.id} started`);
  });

  worker.on('completed', (job) => {
    console.log(`[worker:${worker.name}] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(
      `[worker:${worker.name}] Job ${job?.id ?? 'unknown'} failed:`,
      err.message,
    );
  });

  worker.on('error', (err) => {
    console.error(`[worker:${worker.name}] Worker error:`, err.message);
  });

  console.log(`[workers] Started worker: ${worker.name}`);
}

// Start the markdown sync service (catches completed items missing markdown files)
const markdownSyncInterval = startMarkdownSync();

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  console.log(`[workers] Received ${signal}, shutting down workers...`);

  clearInterval(markdownSyncInterval);
  await Promise.all(workers.map((w) => w.close()));

  console.log('[workers] All workers stopped.');
  process.exitCode = 0;
  // Node will exit naturally when the event loop is empty
}

process.on('SIGTERM', () => { shutdown('SIGTERM').catch(console.error) })
process.on('SIGINT', () => { shutdown('SIGINT').catch(console.error) })
