import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    }),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  },
}));

vi.mock('@/lib/ai/openrouter', () => ({
  createEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  chatCompletion: vi.fn().mockResolvedValue('test response'),
}));

import { GET } from '@/app/api/search/route';

function makeSearchRequest(params: Record<string, string>, headers?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/search');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'test-key',
      ...headers,
    },
  });
}

describe('GET /api/search', () => {
  beforeEach(() => {
    process.env.API_KEY = 'test-key';
    vi.clearAllMocks();
  });

  it('returns 401 when the API key is missing', async () => {
    const req = makeSearchRequest({ q: 'test query' }, { 'x-api-key': '' });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when the q param is empty', async () => {
    const req = makeSearchRequest({ q: '' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/required/i);
  });

  it('returns 400 when the q param is missing', async () => {
    const req = makeSearchRequest({});
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/required/i);
  });

  it('returns 200 with results array when a valid q param is given', async () => {
    const req = makeSearchRequest({ q: 'machine learning' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('results');
    expect(Array.isArray(body.results)).toBe(true);
  });

  it('calls createEmbedding with the trimmed query', async () => {
    const { createEmbedding } = await import('@/lib/ai/openrouter');
    const req = makeSearchRequest({ q: '  neural networks  ' });
    await GET(req);
    expect(createEmbedding).toHaveBeenCalledWith('neural networks');
  });
});
