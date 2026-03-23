import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNotNull, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, categories } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';
import { createEmbedding } from '@/lib/ai/openrouter';

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const searchParams = request.nextUrl.searchParams;

  const query = searchParams.get('q');
  if (!query || query.trim() === '') {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  const categoryFilter = searchParams.get('category') ?? undefined;
  const sourceTypeFilter = searchParams.get('source_type') ?? undefined;
  const dateRangeFilter = searchParams.get('date_range') ?? undefined;
  const limitParam = parseInt(searchParams.get('limit') ?? '10', 10);
  const limit = Math.min(20, Math.max(1, isNaN(limitParam) ? 10 : limitParam));

  // Compute the cutoff date from date_range param (e.g. "7d", "30d", "90d")
  let dateFrom: Date | undefined;
  if (dateRangeFilter) {
    const days = parseInt(dateRangeFilter, 10);
    if (!isNaN(days) && days > 0) {
      dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }
  }

  // --- Attempt vector search first ---
  try {
    const embedding = await createEmbedding(query.trim());

    // sql.raw is safe here: embedding values come from OpenRouter's API, not user input
    const embeddingLiteral = sql.raw(`'[${embedding.join(',')}]'`);
    const similarityExpr = sql<number>`1 - (${items.embedding} <=> ${embeddingLiteral})`;

    const vectorConditions = and(
      eq(items.processingStatus, 'completed'),
      isNotNull(items.embedding),
      categoryFilter ? eq(categories.slug, categoryFilter) : undefined,
      sourceTypeFilter ? eq(items.sourceType, sourceTypeFilter) : undefined,
      dateFrom ? gte(items.createdAt, dateFrom) : undefined,
    );

    const results = await db
      .select({
        id: items.id,
        title: items.title,
        url: items.url,
        summary: items.summary,
        sourceType: items.sourceType,
        categoryName: categories.name,
        categorySlug: categories.slug,
        similarity: similarityExpr,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(vectorConditions)
      .orderBy(sql`${items.embedding} <=> ${embeddingLiteral}`)
      .limit(limit);

    return NextResponse.json({
      results: results.map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        summary: r.summary,
        category: r.categorySlug,
        source_type: r.sourceType,
        similarity: r.similarity,
      })),
    });
  } catch (err) {
    console.error('[search] Vector search failed, falling back to FTS:', err);
  }

  // --- FTS fallback (used when embedding generation fails) ---
  try {
    const ftsConditions: ReturnType<typeof sql>[] = [
      sql`i.processing_status = 'completed'`,
      sql`to_tsvector('english', coalesce(i.title, '') || ' ' || coalesce(i.summary, '')) @@ plainto_tsquery('english', ${query.trim()})`,
    ];

    if (categoryFilter) {
      ftsConditions.push(sql`c.slug = ${categoryFilter}`);
    }
    if (sourceTypeFilter) {
      ftsConditions.push(sql`i.source_type = ${sourceTypeFilter}`);
    }
    if (dateFrom) {
      ftsConditions.push(sql`i.created_at >= ${dateFrom}`);
    }

    const whereClause = ftsConditions.reduce(
      (acc, part) => sql`${acc} AND ${part}`
    );

    const ftsResult = await db.execute(sql`
      SELECT
        i.id,
        i.title,
        i.url,
        i.summary,
        i.source_type AS source_type,
        c.slug AS category_slug
      FROM items i
      LEFT JOIN categories c ON c.id = i.category_id
      WHERE ${whereClause}
      LIMIT ${limit}
    `);

    const ftsRows = ftsResult.rows as Array<{
      id: string;
      title: string | null;
      url: string;
      summary: string | null;
      source_type: string;
      category_slug: string | null;
    }>;

    return NextResponse.json({
      results: ftsRows.map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        summary: r.summary,
        category: r.category_slug,
        source_type: r.source_type,
        similarity: null,
      })),
    });
  } catch (ftsErr) {
    console.error('[search] FTS fallback failed:', ftsErr);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
