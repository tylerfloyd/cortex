import { describe, it, expect } from 'vitest';
import { buildSummarizePrompt, buildCategorizePrompt } from '../ai/prompts';

describe('buildSummarizePrompt', () => {
  it('returns an array of message objects', () => {
    const messages = buildSummarizePrompt('Some content here.');
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThan(0);
  });

  it('includes a system message', () => {
    const messages = buildSummarizePrompt('content');
    const systemMsg = messages.find((m) => m.role === 'system');
    expect(systemMsg).toBeDefined();
    expect(typeof systemMsg!.content).toBe('string');
    expect(systemMsg!.content.length).toBeGreaterThan(0);
  });

  it('includes a user message containing the raw content', () => {
    const rawContent = 'This is the article text that needs summarizing.';
    const messages = buildSummarizePrompt(rawContent);
    const userMsg = messages.find((m) => m.role === 'user');
    expect(userMsg).toBeDefined();
    expect(userMsg!.content).toContain(rawContent);
  });

  it('user message requests a JSON response with the required fields', () => {
    const messages = buildSummarizePrompt('content');
    const userMsg = messages.find((m) => m.role === 'user')!;
    expect(userMsg.content).toContain('summary');
    expect(userMsg.content).toContain('key_insights');
    expect(userMsg.content).toContain('content_type');
  });
});

describe('buildCategorizePrompt', () => {
  const categories = [
    { name: 'Technology', slug: 'technology' },
    { name: 'Science', slug: 'science' },
  ];
  const popularTags = ['ai', 'machine-learning', 'python'];

  it('returns an array of message objects', () => {
    const messages = buildCategorizePrompt('A summary', categories, popularTags);
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThan(0);
  });

  it('includes a system message', () => {
    const messages = buildCategorizePrompt('A summary', categories, popularTags);
    const systemMsg = messages.find((m) => m.role === 'system');
    expect(systemMsg).toBeDefined();
    expect(systemMsg!.content.length).toBeGreaterThan(0);
  });

  it('user message contains the category names', () => {
    const messages = buildCategorizePrompt('A summary', categories, popularTags);
    const userMsg = messages.find((m) => m.role === 'user')!;
    expect(userMsg.content).toContain('Technology');
    expect(userMsg.content).toContain('Science');
  });

  it('user message contains the category slugs', () => {
    const messages = buildCategorizePrompt('A summary', categories, popularTags);
    const userMsg = messages.find((m) => m.role === 'user')!;
    expect(userMsg.content).toContain('technology');
    expect(userMsg.content).toContain('science');
  });

  it('user message contains the summary text', () => {
    const summary = 'A detailed summary of an AI article';
    const messages = buildCategorizePrompt(summary, categories, popularTags);
    const userMsg = messages.find((m) => m.role === 'user')!;
    expect(userMsg.content).toContain(summary);
  });

  it('user message contains popular tags', () => {
    const messages = buildCategorizePrompt('A summary', categories, popularTags);
    const userMsg = messages.find((m) => m.role === 'user')!;
    expect(userMsg.content).toContain('ai');
    expect(userMsg.content).toContain('machine-learning');
  });

  it('handles an empty categories array', () => {
    const messages = buildCategorizePrompt('A summary', [], []);
    expect(messages).toBeDefined();
    expect(messages.length).toBeGreaterThan(0);
  });
});
