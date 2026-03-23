import { describe, it, expect } from 'vitest';
import { slugify } from '../slugify';

describe('slugify', () => {
  it('converts a simple title to lowercase hyphenated slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('handles AI/ML style slashes', () => {
    expect(slugify('AI/ML')).toBe('ai-ml');
  });

  it('strips special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
  });

  it('collapses multiple spaces/hyphens into a single hyphen', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });

  it('removes leading hyphens', () => {
    expect(slugify('  leading spaces')).toBe('leading-spaces');
  });

  it('removes trailing hyphens', () => {
    expect(slugify('trailing spaces  ')).toBe('trailing-spaces');
  });

  it('handles numbers', () => {
    expect(slugify('Chapter 42')).toBe('chapter-42');
  });

  it('handles a string that is all special characters', () => {
    expect(slugify('!@#$%')).toBe('');
  });

  it('handles an already-slugified string', () => {
    expect(slugify('already-a-slug')).toBe('already-a-slug');
  });

  it('handles mixed case', () => {
    expect(slugify('MixedCASE')).toBe('mixedcase');
  });
});
