/**
 * Count words in a text string.
 * Note: Uses whitespace splitting which may undercount CJK text.
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
