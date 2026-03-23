import { createEmbedding } from './openrouter';

/**
 * Generate an embedding vector from item metadata.
 * Concatenates title, summary, and key insights then calls the embeddings API.
 * Returns a 1536-dimension number[] vector.
 */
export async function generateEmbedding(
  title: string | null,
  summary: string,
  keyInsights: string[],
): Promise<number[]> {
  let text = [title, summary, ...keyInsights].filter(Boolean).join('\n\n');

  if (!text) {
    throw new Error('Cannot generate embedding: no text content');
  }

  // Truncate to ~30,000 chars to stay within text-embedding-3-small's 8,191 token limit (~4 chars/token)
  if (text.length > 30_000) {
    text = text.slice(0, 30_000);
  }

  return createEmbedding(text);
}
