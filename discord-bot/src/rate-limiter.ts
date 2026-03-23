const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 1000; // 60 seconds

interface BucketEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private counts: Map<string, BucketEntry> = new Map();

  private getEntry(userId: string): BucketEntry {
    const now = Date.now();
    let entry = this.counts.get(userId);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + WINDOW_MS };
      this.counts.set(userId, entry);
    }

    return entry;
  }

  isAllowed(userId: string): boolean {
    const entry = this.getEntry(userId);
    if (entry.count >= MAX_REQUESTS) return false;
    entry.count++;
    return true;
  }

  getRemainingRequests(userId: string): number {
    const entry = this.getEntry(userId);
    return Math.max(0, MAX_REQUESTS - entry.count);
  }
}
