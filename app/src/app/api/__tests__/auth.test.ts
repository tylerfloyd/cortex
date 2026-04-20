import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    process.env.AUTH_PASSWORD = 'correct-password'
    process.env.AUTH_SECRET = 'test-secret-32-bytes-long-xxxxxxxx'
  })

  afterEach(() => {
    delete process.env.AUTH_PASSWORD
    delete process.env.AUTH_SECRET
  })

  it('redirects with error=wrong on incorrect password', async () => {
    const { POST } = await import('@/app/api/auth/login/route')
    const form = new FormData()
    form.append('password', 'wrong-password')
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: form,
      headers: { host: 'localhost', 'x-forwarded-proto': 'http' },
    })
    const res = await POST(req)
    expect(res.status).toBe(303)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('error=wrong')
    expect(location).not.toContain('error=1')
  })

  it('redirects with error=wrong on empty password', async () => {
    const { POST } = await import('@/app/api/auth/login/route')
    const form = new FormData()
    form.append('password', '')
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: form,
      headers: { host: 'localhost', 'x-forwarded-proto': 'http' },
    })
    const res = await POST(req)
    expect(res.status).toBe(303)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('error=wrong')
  })
})
