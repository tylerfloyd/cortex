import { describe, it, expect } from 'vitest';
import { relativeTime, truncateUrl } from '../format';

// ---------------------------------------------------------------------------
// relativeTime
// ---------------------------------------------------------------------------

describe('relativeTime', () => {
  it('returns empty string for null', () => {
    expect(relativeTime(null)).toBe('');
  });

  it('returns "just now" for a date fewer than 60 seconds ago', () => {
    const recent = new Date(Date.now() - 30_000); // 30 seconds ago
    expect(relativeTime(recent)).toBe('just now');
  });

  it('returns "X minutes ago" for a date a few minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000);
    expect(relativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('uses singular "minute" for exactly 1 minute ago', () => {
    const oneMinuteAgo = new Date(Date.now() - 61_000); // slightly over 1 min
    expect(relativeTime(oneMinuteAgo)).toBe('1 minute ago');
  });

  it('returns "X hours ago" for a date a few hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000);
    expect(relativeTime(threeHoursAgo)).toBe('3 hours ago');
  });

  it('uses singular "hour" for exactly 1 hour ago', () => {
    const oneHourAgo = new Date(Date.now() - 61 * 60_000);
    expect(relativeTime(oneHourAgo)).toBe('1 hour ago');
  });

  it('returns "X days ago" for a date a few days ago', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60_000);
    expect(relativeTime(fiveDaysAgo)).toBe('5 days ago');
  });

  it('uses singular "day" for exactly 1 day ago', () => {
    const oneDayAgo = new Date(Date.now() - 25 * 60 * 60_000);
    expect(relativeTime(oneDayAgo)).toBe('1 day ago');
  });

  it('returns "X months ago" for a date a few months ago', () => {
    const twoMonthsAgo = new Date(Date.now() - 65 * 24 * 60 * 60_000); // ~2 months
    expect(relativeTime(twoMonthsAgo)).toBe('2 months ago');
  });

  it('returns "X years ago" for a date over a year ago', () => {
    const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60_000);
    expect(relativeTime(twoYearsAgo)).toBe('2 years ago');
  });

  it('accepts an ISO date string', () => {
    const str = new Date(Date.now() - 30_000).toISOString();
    expect(relativeTime(str)).toBe('just now');
  });
});

// ---------------------------------------------------------------------------
// truncateUrl
// ---------------------------------------------------------------------------

describe('truncateUrl', () => {
  it('returns hostname + pathname for a short URL unchanged', () => {
    expect(truncateUrl('https://example.com/path')).toBe('example.com/path');
  });

  it('strips query params and protocol', () => {
    expect(truncateUrl('https://example.com/path?foo=bar')).toBe('example.com/path');
  });

  it('truncates a long URL with an ellipsis', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(80);
    const result = truncateUrl(longUrl);
    expect(result.endsWith('…')).toBe(true);
    // The display portion before the ellipsis should be exactly 60 chars
    expect(result.length).toBe(61); // 60 chars + 1 ellipsis char
  });

  it('uses a custom maxLen', () => {
    const url = 'https://example.com/short-path';
    // 'example.com/short-path' is 22 chars, so maxLen=10 should truncate
    const result = truncateUrl(url, 10);
    expect(result.endsWith('…')).toBe(true);
  });

  it('does not truncate when hostname+pathname is exactly maxLen', () => {
    // 'example.com/path' = 16 chars
    const result = truncateUrl('https://example.com/path', 16);
    expect(result).toBe('example.com/path');
  });

  it('handles an invalid URL gracefully by treating it as a plain string', () => {
    const shortPlain = 'short';
    expect(truncateUrl(shortPlain)).toBe('short');
  });

  it('truncates a long plain (non-URL) string', () => {
    const long = 'x'.repeat(80);
    const result = truncateUrl(long);
    expect(result.endsWith('…')).toBe(true);
  });
});
