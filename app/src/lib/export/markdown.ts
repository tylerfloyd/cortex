import fs from 'fs/promises';
import path from 'path';
import { KNOWLEDGE_DIR } from './config';

export interface FullItem {
  id: string;
  title: string | null;
  url: string;
  sourceType: string;
  author: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  captureSource: string | null;
  categorySlug: string | null;
  tags: string[];
  contentType: string | null;
  difficultyLevel: string | null;
  estimatedReadTimeMinutes: number | null;
  summary: string | null;
  keyInsights: unknown;
  rawContent: string | null;
}

// Generate a URL-safe slug from a title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Determine the folder path for an item
export function getCategoryFolder(categorySlug: string): string {
  return path.join(KNOWLEDGE_DIR, categorySlug);
}

// Write a markdown file for an item, returns the file path written
export async function writeItemMarkdown(item: FullItem): Promise<string> {
  const categorySlug = item.categorySlug ?? 'uncategorized';
  const dir = getCategoryFolder(categorySlug);

  await fs.mkdir(dir, { recursive: true });

  const baseSlug = item.title ? generateSlug(item.title) : item.id;
  let fileName = `${baseSlug}.md`;
  let filePath = path.join(dir, fileName);

  // Handle filename conflicts
  try {
    await fs.access(filePath);
    // File exists — check if it belongs to this item already
    const existing = await fs.readFile(filePath, 'utf-8');
    const idMatch = existing.match(/^id:\s*"([^"]+)"/m);
    if (!idMatch || idMatch[1] !== item.id) {
      // Conflict with a different item — append short item ID
      fileName = `${baseSlug}-${item.id.slice(0, 8)}.md`;
      filePath = path.join(dir, fileName);
    }
  } catch {
    // File does not exist — no conflict
  }

  const keyInsights = Array.isArray(item.keyInsights) ? (item.keyInsights as string[]) : [];

  const frontmatter = buildFrontmatter(item, categorySlug);
  const title = item.title ?? item.url;

  const insightLines =
    keyInsights.length > 0
      ? keyInsights.map((insight) => `- ${insight}`).join('\n')
      : '- No key insights available';

  const content = `${frontmatter}
# ${title}

## Summary

${item.summary ?? '_No summary available._'}

## Key Insights

${insightLines}

## Source Content

${item.rawContent ?? '_No source content available._'}
`;

  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}

function buildFrontmatter(item: FullItem, categorySlug: string): string {
  const publishedValue = item.publishedAt
    ? item.publishedAt.toISOString().slice(0, 10)
    : '';
  const capturedValue = item.createdAt.toISOString();
  const tagsYaml =
    item.tags.length > 0
      ? `[${item.tags.map((t) => `"${t}"`).join(', ')}]`
      : '[]';

  const lines: string[] = [
    '---',
    `id: "${item.id}"`,
    `title: "${escapeYamlString(item.title ?? '')}"`,
    `url: "${item.url}"`,
    `source_type: "${item.sourceType}"`,
    `author: "${escapeYamlString(item.author ?? '')}"`,
    `published: ${publishedValue}`,
    `captured: "${capturedValue}"`,
    `capture_source: "${item.captureSource ?? ''}"`,
    `category: "${categorySlug}"`,
    `tags: ${tagsYaml}`,
    `content_type: "${item.contentType ?? ''}"`,
    `difficulty: "${item.difficultyLevel ?? ''}"`,
    `read_time_minutes: ${item.estimatedReadTimeMinutes ?? 'null'}`,
    '---',
  ];

  return lines.join('\n');
}

function escapeYamlString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

// Delete the markdown file for an item
export async function deleteItemMarkdown(filePath: string): Promise<void> {
  await fs.unlink(filePath);
}

/**
 * Move a markdown file from one category folder to another when an item is re-categorized.
 *
 * NOTE: This function is intentional scaffolding — it will be called by the
 * Markdown Sync Service (Task 5.2) when items are re-categorized and their
 * markdown files need to be relocated to match the updated category slug.
 */
export async function moveItemMarkdown(oldPath: string, newPath: string): Promise<void> {
  const newDir = path.dirname(newPath);
  await fs.mkdir(newDir, { recursive: true });
  await fs.rename(oldPath, newPath);
}
