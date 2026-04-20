import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';

describe('session', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'test-secret-32-bytes-long-xxxxxxxx';
  });

  afterEach(() => {
    delete process.env.AUTH_SECRET;
  });

  describe('createSession', () => {
    it('returns a string in expires:hmac format', async () => {
      const { createSession } = await import('@/lib/auth/session');
      const session = createSession();
      expect(session).toMatch(/^\d+:[a-f0-9]{64}$/);
    });

    it('throws if AUTH_SECRET is not set', async () => {
      delete process.env.AUTH_SECRET;
      const { createSession } = await import('@/lib/auth/session');
      expect(() => createSession()).toThrow('AUTH_SECRET is not set');
    });
  });

  describe('verifySession', () => {
    it('returns true for a freshly created session', async () => {
      const { createSession, verifySession } = await import('@/lib/auth/session');
      const session = createSession();
      expect(verifySession(session)).toBe(true);
    });

    it('returns false for an expired session', async () => {
      const { verifySession } = await import('@/lib/auth/session');
      const secret = process.env.AUTH_SECRET!;
      const expires = (Date.now() - 1000).toString();
      const hmac = createHmac('sha256', secret).update(expires).digest('hex');
      expect(verifySession(`${expires}:${hmac}`)).toBe(false);
    });

    it('returns false for a tampered HMAC', async () => {
      const { createSession, verifySession } = await import('@/lib/auth/session');
      const session = createSession();
      const [expires] = session.split(':');
      expect(verifySession(`${expires}:${'a'.repeat(64)}`)).toBe(false);
    });

    it('returns false if AUTH_SECRET is not set', async () => {
      delete process.env.AUTH_SECRET;
      const { verifySession } = await import('@/lib/auth/session');
      expect(verifySession('9999999999999:deadbeef')).toBe(false);
    });
  });
});
