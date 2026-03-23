import { describe, it, expect, vi, afterEach } from 'vitest';
import { extractReddit } from '../extractors/reddit';

// buildJsonUrl is not exported; we test its behaviour by observing what URL
// fetch is called with via extractReddit (which is the public entry point).

afterEach(() => {
  vi.restoreAllMocks();
});

describe('extractReddit — URL validation', () => {
  it('throws for a non-Reddit URL', async () => {
    await expect(extractReddit('https://example.com/post/123')).rejects.toThrow(
      'Not a Reddit URL',
    );
  });
});

describe('extractReddit — JSON URL construction (via fetch spy)', () => {
  it('appends .json to the Reddit post path and strips query params', async () => {
    const capturedUrls: string[] = [];

    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => buildFakeRedditPayload(),
    };

    vi.stubGlobal('fetch', (url: string) => {
      capturedUrls.push(url);
      return Promise.resolve(mockResponse);
    });

    await extractReddit('https://www.reddit.com/r/programming/comments/abc123/test_post/?utm_source=share');

    expect(capturedUrls).toHaveLength(1);
    const fetchedUrl = capturedUrls[0];
    // Should end with .json and not contain the original query string
    expect(fetchedUrl).toMatch(/\.json/);
    expect(fetchedUrl).not.toContain('utm_source');
    // Path should still contain the post path
    expect(fetchedUrl).toContain('/r/programming/comments/abc123/test_post');
  });

  it('does not double-append .json when URL already ends with slash', async () => {
    const capturedUrls: string[] = [];

    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => buildFakeRedditPayload(),
    };

    vi.stubGlobal('fetch', (url: string) => {
      capturedUrls.push(url);
      return Promise.resolve(mockResponse);
    });

    await extractReddit('https://www.reddit.com/r/test/comments/xyz789/a_post/');

    const fetchedUrl = capturedUrls[0];
    // Trailing slash should be stripped before .json is appended
    expect(fetchedUrl).not.toMatch(/\/\.json/);
    expect(fetchedUrl).toMatch(/a_post\.json/);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildFakeRedditPayload() {
  const post = {
    title: 'Test Post',
    author: 'test_user',
    subreddit: 'programming',
    score: 100,
    selftext: 'This is the post body with enough text to pass word count.',
    url: 'https://www.reddit.com/r/programming/comments/abc123/test_post/',
    is_self: true,
    over_18: false,
    created_utc: 1_700_000_000,
  };

  return [
    { kind: 'Listing', data: { children: [{ kind: 't3', data: post }] } },
    { kind: 'Listing', data: { children: [] } },
  ];
}
