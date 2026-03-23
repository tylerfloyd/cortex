import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the DB and queue before importing the route handler
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'test-id', processingStatus: 'pending' }]),
          }),
        }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
      return fn(mockTx);
    }),
  },
}));

vi.mock('@/lib/queue/queues', () => ({
  extractionQueue: { add: vi.fn().mockResolvedValue(undefined) },
}));

import { POST } from '@/app/api/items/ingest/route';

function makeIngestRequest(body: unknown, headers?: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost/api/items/ingest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'test-key',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/items/ingest', () => {
  beforeEach(() => {
    process.env.API_KEY = 'test-key';
    vi.clearAllMocks();
  });

  it('returns 201 for a valid URL and capture_source', async () => {
    const req = makeIngestRequest({ url: 'https://example.com/article', capture_source: 'api' });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe('queued');
  });

  it('returns 400 when url is a non-URL string', async () => {
    const req = makeIngestRequest({ url: 'not-a-url', capture_source: 'api' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/validation failed/i);
  });

  it('returns 400 when url is missing', async () => {
    const req = makeIngestRequest({ capture_source: 'api' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/validation failed/i);
  });

  it('returns 201 for all valid capture_source enum values', async () => {
    const validSources = ['discord', 'extension', 'dashboard', 'api'] as const;
    for (const source of validSources) {
      const req = makeIngestRequest({ url: 'https://example.com', capture_source: source });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }
  });

  it('returns 400 for an invalid capture_source value', async () => {
    const req = makeIngestRequest({ url: 'https://example.com', capture_source: 'invalid-source' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/validation failed/i);
  });

  it('returns 401 when the API key is missing', async () => {
    const req = makeIngestRequest(
      { url: 'https://example.com', capture_source: 'api' },
      { 'x-api-key': '' },
    );
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for malformed JSON', async () => {
    const req = new NextRequest('http://localhost/api/items/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'test-key' },
      body: 'this is not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
