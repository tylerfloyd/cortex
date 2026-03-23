import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tags, itemTags } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';
import { sql } from 'drizzle-orm';

interface TagRow {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
}

/**
 * Compute a simple similarity score between two tag names.
 * Returns a value between 0 and 1. Considers:
 * - case-insensitive equality (1.0)
 * - one is a substring of the other (0.9)
 * - normalized forms match after stripping punctuation/spaces (0.95)
 */
function tagSimilarity(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/[-_\s]/g, '');
  const na = norm(a);
  const nb = norm(b);

  if (na === nb) return 1.0;
  if (na.includes(nb) || nb.includes(na)) return 0.9;

  // Abbreviation check: one is the initials of the other
  // e.g. "ML" and "machine-learning"
  const initials = (s: string) =>
    s
      .split(/[-_\s]+/)
      .map((w) => w[0] ?? '')
      .join('')
      .toLowerCase();
  if (initials(a) === nb || initials(b) === na) return 0.85;

  return 0;
}

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  // Fetch all tags with usage counts
  const rows: TagRow[] = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      usageCount: sql<number>`count(${itemTags.tagId})::int`,
    })
    .from(tags)
    .leftJoin(itemTags, sql`${itemTags.tagId} = ${tags.id}`)
    .groupBy(tags.id, tags.name, tags.slug)
    .orderBy(tags.name);

  const suggestions: Array<{
    tagA: TagRow;
    tagB: TagRow;
    similarity: number;
    reason: string;
  }> = [];

  // O(n²) comparison — acceptable for typical tag counts (<10k)
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const score = tagSimilarity(rows[i].name, rows[j].name);
      if (score >= 0.85) {
        let reason = 'similar name';
        if (score === 1.0) reason = 'case or separator variant';
        else if (score === 0.9) reason = 'one contains the other';
        else if (score === 0.85) reason = 'possible abbreviation';

        suggestions.push({
          tagA: rows[i],
          tagB: rows[j],
          similarity: score,
          reason,
        });
      }
    }
  }

  // Sort by similarity desc, then by combined usage count desc
  suggestions.sort((a, b) => {
    if (b.similarity !== a.similarity) return b.similarity - a.similarity;
    return b.tagA.usageCount + b.tagB.usageCount - (a.tagA.usageCount + a.tagB.usageCount);
  });

  return NextResponse.json({ suggestions: suggestions.slice(0, 100) });
}
