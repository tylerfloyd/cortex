import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { validateApiKey } from '@/lib/auth/api-key';

function makeNextRequest(headers?: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost/api/test', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('validateApiKey', () => {
  beforeEach(() => {
    process.env.API_KEY = 'test-key';
  });

  it('returns null (no error) when the correct API key is provided', () => {
    const req = makeNextRequest({ 'x-api-key': 'test-key' });
    const result = validateApiKey(req);
    expect(result).toBeNull();
  });

  it('returns a 401 response when the wrong API key is provided', async () => {
    const req = makeNextRequest({ 'x-api-key': 'wrong-key' });
    const result = validateApiKey(req);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
    const body = await result!.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('returns a 401 response when the API key header is missing', async () => {
    const req = makeNextRequest();
    const result = validateApiKey(req);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
    const body = await result!.json();
    expect(body.error).toMatch(/unauthorized/i);
  });
});
