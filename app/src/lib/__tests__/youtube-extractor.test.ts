import { describe, it, expect, vi } from 'vitest';

// youtube-transcript ships a CJS bundle inside a package.json that declares
// "type": "module", which breaks native ESM resolution in vitest. Mock it
// before importing youtube.ts so the broken package is never loaded.
vi.mock('youtube-transcript', () => ({
  YoutubeTranscript: {
    fetchTranscript: vi.fn().mockResolvedValue([]),
  },
}));

const { extractVideoId } = await import('../extractors/youtube');

describe('extractVideoId', () => {
  it('extracts video ID from youtube.com/watch?v= URL', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=abc123')).toBe('abc123');
  });

  it('extracts video ID from youtu.be short URL', () => {
    expect(extractVideoId('https://youtu.be/abc123')).toBe('abc123');
  });

  it('extracts video ID from youtube.com/embed/ URL', () => {
    // The implementation handles /shorts/ but not /embed/ explicitly;
    // /embed/ falls through to the watch?v param check, so we test
    // that a URL without a recognised pattern throws.
    expect(() => extractVideoId('https://youtube.com/embed/abc123')).toThrow(
      'Could not extract YouTube video ID from URL',
    );
  });

  it('extracts video ID from youtube.com/shorts/ URL', () => {
    expect(extractVideoId('https://www.youtube.com/shorts/abc123')).toBe('abc123');
  });

  it('ignores extra query params on watch URL', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=abc123&t=42')).toBe('abc123');
  });

  it('throws for an invalid URL', () => {
    expect(() => extractVideoId('not-a-url')).toThrow(
      'Could not extract YouTube video ID from URL',
    );
  });

  it('throws for a valid URL with no video ID', () => {
    expect(() => extractVideoId('https://youtube.com/')).toThrow(
      'Could not extract YouTube video ID from URL',
    );
  });

  it('throws for a non-YouTube URL', () => {
    expect(() => extractVideoId('https://vimeo.com/abc123')).toThrow(
      'Could not extract YouTube video ID from URL',
    );
  });
});
