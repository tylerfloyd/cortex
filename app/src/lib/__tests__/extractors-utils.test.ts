import { describe, it, expect } from 'vitest';
import { countWords } from '../extractors/utils';

describe('countWords', () => {
  it('returns 0 for an empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('returns 0 for a whitespace-only string', () => {
    expect(countWords('   ')).toBe(0);
  });

  it('returns 1 for a single word', () => {
    expect(countWords('hello')).toBe(1);
  });

  it('returns correct count for multiple words', () => {
    expect(countWords('hello world foo')).toBe(3);
  });

  it('handles extra spaces between words', () => {
    expect(countWords('  hello   world  ')).toBe(2);
  });

  it('treats newlines as whitespace', () => {
    expect(countWords('hello\nworld\nfoo')).toBe(3);
  });

  it('treats tabs as whitespace', () => {
    expect(countWords('hello\tworld')).toBe(2);
  });

  it('handles mixed whitespace characters', () => {
    expect(countWords('one\n two\t three  four')).toBe(4);
  });
});
