import fs from 'fs/promises';
import path from 'path';
import { inArray, eq, getTableColumns } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, categories, tags, itemTags } from '@/lib/db/schema';
import { generateSlug, getCategoryFolder } from './markdown';
import { KNOWLEDGE_DIR } from './config';

const INDEX_PATH = path.join(KNOWLEDGE_DIR, '_index.json');

interface IndexEntry {
  id: string;
  title: string | null;
  url: string;
  source_type: string;
  category: string | null;
  tags: string[];
  content_type: string | null;
  difficulty: string | null;
  read_time_minutes: number | null;
  captured: string;
  file_path: string;
}

interface KnowledgeIndex {
  generated_at: string;
  total_items: number;
  items: IndexEntry[];
}

// Regenerates the full index from scratch by querying all items
export async function regenerateIndex(): Promise<void> {
  // Query all completed items with their category slugs
  const rows = await db
    .select({
      ...getTableColumns(items),
      categorySlug: categories.slug,
      markdownFilePath: items.markdownFilePath,
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(inArray(items.processingStatus, ['completed', 'ai-complete']));

  // Fetch tags for all items in one pass
  const itemIds = rows.map((r) => r.id);
  const allItemTagRows =
    itemIds.length > 0
      ? await db
          .select({ itemId: itemTags.itemId, name: tags.name })
          .from(itemTags)
          .innerJoin(tags, eq(itemTags.tagId, tags.id))
          .where(inArray(itemTags.itemId, itemIds))
      : [];

  // Group tags by item ID
  const tagsByItemId = new Map<string, string[]>();
  for (const row of allItemTagRows) {
    const existing = tagsByItemId.get(row.itemId) ?? [];
    existing.push(row.name);
    tagsByItemId.set(row.itemId, existing);
  }

  const indexEntries: IndexEntry[] = [];

  for (const row of rows) {
    const itemTagNames = tagsByItemId.get(row.id) ?? [];
    const categorySlug = row.categorySlug ?? 'uncategorized';

    // Use the stored markdownFilePath if available; fall back to deriving it
    // using the same slug logic as writeItemMarkdown
    let filePath: string;
    if (row.markdownFilePath) {
      filePath = row.markdownFilePath;
    } else {
      const baseSlug = row.title ? generateSlug(row.title) : row.id;
      const dir = getCategoryFolder(categorySlug);
      const relativeDir = path.relative(KNOWLEDGE_DIR, dir);
      filePath = `/knowledge/${relativeDir}/${baseSlug}.md`;
    }

    indexEntries.push({
      id: row.id,
      title: row.title ?? null,
      url: row.url,
      source_type: row.sourceType,
      category: categorySlug,
      tags: itemTagNames,
      content_type: row.contentType ?? null,
      difficulty: row.difficultyLevel ?? null,
      read_time_minutes: row.estimatedReadTimeMinutes ?? null,
      captured: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
      file_path: filePath,
    });
  }

  const index: KnowledgeIndex = {
    generated_at: new Date().toISOString(),
    total_items: indexEntries.length,
    items: indexEntries,
  };

  await fs.mkdir(KNOWLEDGE_DIR, { recursive: true });
  await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2), 'utf-8');
}
