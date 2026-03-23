import { pollItemStatus, ApiError } from './api-client.js';

// Poll item processing status until it reaches a terminal state or the timeout elapses.
// Returns the final status: 'completed', 'failed', or 'timeout'.
export async function pollUntilComplete(
  itemId: string,
  timeoutMs: number,
  intervalMs: number,
): Promise<'completed' | 'failed' | 'timeout'> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const statusData = await pollItemStatus(itemId);
      const status = statusData.processing_status;
      if (status === 'completed') return 'completed';
      if (status === 'failed') return 'failed';
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        // 4xx errors (e.g. 404 not found) are not transient — re-throw immediately
        throw err;
      }
      // On transient errors, log and continue polling
      console.warn('[poller] Transient error during poll, retrying:', err);
      // Continue loop - don't return 'failed' for network hiccups
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;

    await new Promise<void>((resolve) =>
      setTimeout(resolve, Math.min(intervalMs, remaining)),
    );
  }

  return 'timeout';
}
