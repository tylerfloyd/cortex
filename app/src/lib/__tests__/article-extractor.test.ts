import { describe, it, expect, vi, afterEach } from 'vitest';

// parseTitleFromMarkdown is a private (unexported) helper in article.ts.
// We test its behaviour indirectly via extractArticle, which calls it on the
// Jina API response and surfaces the result as the `title` field.

// Mock the config module to avoid filesystem reads during tests.
vi.mock('@/lib/config', () => ({
  readApiKeys: async () => ({ jina: null }),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parseTitleFromMarkdown (via extractArticle)', () => {
  it('extracts the H1 title from markdown content', async () => {
    const markdown = `# My Article Title\n\nSome body content here that is long enough to pass the paywall threshold. `.repeat(5);

    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: async () => markdown,
      }),
    );

    const { extractArticle } = await import('../extractors/article');
    const result = await extractArticle('https://example.com/article');

    expect(result.title).toBe('My Article Title');
  });

  it('returns null title when there is no H1 heading in the markdown', async () => {
    const markdown = `## Secondary heading\n\nSome body content here that is long enough to pass the paywall threshold. `.repeat(5);

    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: async () => markdown,
      }),
    );

    // Re-import to ensure the mock is in effect (module may be cached)
    const { extractArticle } = await import('../extractors/article');
    const result = await extractArticle('https://example.com/article');

    expect(result.title).toBeNull();
  });
});
