import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateSlug, writeItemMarkdown } from '../export/markdown';
import type { FullItem } from '../export/markdown';

// ---------------------------------------------------------------------------
// generateSlug
// ---------------------------------------------------------------------------

describe('generateSlug', () => {
  it('converts a simple title to lowercase hyphenated slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('strips special characters', () => {
    expect(generateSlug('Hello, World!')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(generateSlug('one two three')).toBe('one-two-three');
  });

  it('collapses multiple consecutive non-alphanumeric chars into a single hyphen', () => {
    expect(generateSlug('Hello   ---   World')).toBe('hello-world');
  });

  it('removes leading and trailing hyphens', () => {
    expect(generateSlug('  Hello World  ')).toBe('hello-world');
  });

  it('handles a title that is all special characters', () => {
    // Should produce an empty string when nothing alphanumeric survives
    expect(generateSlug('!@#$%')).toBe('');
  });

  it('preserves numbers in the slug', () => {
    expect(generateSlug('Part 2: The Sequel')).toBe('part-2-the-sequel');
  });

  it('handles slashes (e.g. AI/ML)', () => {
    // Slash is not alphanumeric so it becomes a hyphen
    expect(generateSlug('AI/ML Guide')).toBe('ai-ml-guide');
  });
});

// ---------------------------------------------------------------------------
// escapeYamlString (tested indirectly via writeItemMarkdown)
// ---------------------------------------------------------------------------

// Mock the fs/promises module so we never touch the real filesystem.
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    // Simulate "file does not exist" so there are no conflict checks.
    access: vi.fn().mockRejectedValue(new Error('ENOENT')),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(''),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

function buildItem(overrides: Partial<FullItem> = {}): FullItem {
  return {
    id: 'test-id-0001',
    title: 'Test Title',
    url: 'https://example.com',
    sourceType: 'article',
    author: null,
    publishedAt: null,
    createdAt: new Date('2024-01-15T12:00:00Z'),
    captureSource: null,
    categorySlug: 'technology',
    tags: [],
    contentType: null,
    difficultyLevel: null,
    estimatedReadTimeMinutes: null,
    summary: null,
    keyInsights: [],
    rawContent: null,
    ...overrides,
  };
}

describe('escapeYamlString (via writeItemMarkdown frontmatter)', () => {
  it('escapes double quotes in title', async () => {
    const fs = (await import('fs/promises')).default;
    const item = buildItem({ title: 'She said "hello"' });

    await writeItemMarkdown(item);

    const written = (fs.writeFile as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    expect(written).toContain('\\"hello\\"');
  });

  it('escapes backslashes in title', async () => {
    const fs = (await import('fs/promises')).default;
    const item = buildItem({ title: 'Path\\to\\file' });

    await writeItemMarkdown(item);

    const written = (fs.writeFile as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    expect(written).toContain('Path\\\\to\\\\file');
  });

  it('escapes newlines in title', async () => {
    const fs = (await import('fs/promises')).default;
    const item = buildItem({ title: 'Line one\nLine two' });

    await writeItemMarkdown(item);

    const written = (fs.writeFile as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    expect(written).toContain('Line one\\nLine two');
  });

  it('escapes carriage returns in author', async () => {
    const fs = (await import('fs/promises')).default;
    const item = buildItem({ author: 'Author\r Name' });

    await writeItemMarkdown(item);

    const written = (fs.writeFile as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    expect(written).toContain('Author\\r Name');
  });

  it('leaves normal strings unchanged', async () => {
    const fs = (await import('fs/promises')).default;
    const item = buildItem({ title: 'A Normal Title', author: 'Jane Doe' });

    await writeItemMarkdown(item);

    const written = (fs.writeFile as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    expect(written).toContain('title: "A Normal Title"');
    expect(written).toContain('author: "Jane Doe"');
  });
});
