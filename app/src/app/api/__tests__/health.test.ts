import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('returns 200 with status "ok"', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  it('includes a timestamp in the response', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveProperty('timestamp');
    expect(typeof body.timestamp).toBe('string');
    // Should be a valid ISO date string
    expect(() => new Date(body.timestamp)).not.toThrow();
    expect(new Date(body.timestamp).getTime()).not.toBeNaN();
  });

  it('does not require an API key', async () => {
    // Health route has no auth — calling GET() directly always returns 200
    const res = await GET();
    expect(res.status).toBe(200);
  });
});
