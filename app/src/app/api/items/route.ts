import { NextRequest, NextResponse } from 'next/server';
import { eq, and, gte, lte, inArray, desc, asc, sql, SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, categories, tags, itemTags } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const searchParams = request.nextUrl.searchParams;

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20));
  const offset = (page - 1) * limit;

  const categorySlug = searchParams.get('category');
  const sourceType = searchParams.get('source_type');
  const tagsParam = searchParams.get('tags');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const isFavoriteParam = searchParams.get('is_favorite');
  const sort = searchParams.get('sort') ?? 'newest';

  // Build WHERE conditions
  const conditions: SQL[] = [];

  if (sourceType) {
    conditions.push(eq(items.sourceType, sourceType));
  }

  if (dateFrom) {
    const from = new Date(dateFrom);
    if (!isNaN(from.getTime())) {
      conditions.push(gte(items.createdAt, from));
    }
  }

  if (dateTo) {
    const to = new Date(dateTo);
    if (!isNaN(to.getTime())) {
      conditions.push(lte(items.createdAt, to));
    }
  }

  if (isFavoriteParam !== null) {
    if (isFavoriteParam !== 'true' && isFavoriteParam !== 'false') {
      return NextResponse.json(
        { error: "Invalid value for is_favorite: must be 'true' or 'false'" },
        { status: 400 }
      );
    }
    conditions.push(eq(items.isFavorite, isFavoriteParam === 'true'));
  }

  // Category filter — join on slug
  if (categorySlug) {
    const category = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);

    if (category.length > 0) {
      conditions.push(eq(items.categoryId, category[0].id));
    } else {
      // No matching category → return empty
      return NextResponse.json({ items: [], total: 0, page, limit, pages: 0 });
    }
  }

  // Tags filter — find item IDs that have all specified tags
  let tagFilteredItemIds: string[] | null = null;
  if (tagsParam) {
    const tagSlugs = tagsParam.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagSlugs.length > 0) {
      // Get tag IDs
      const matchedTags = await db
        .select({ id: tags.id })
        .from(tags)
        .where(inArray(tags.slug, tagSlugs));

      if (matchedTags.length < tagSlugs.length) {
        // At least one tag doesn't exist → no results
        return NextResponse.json({ items: [], total: 0, page, limit, pages: 0 });
      }

      const tagIds = matchedTags.map((t) => t.id);

      // Find items that have ALL the specified tags
      const itemsWithAllTags = await db
        .select({ itemId: itemTags.itemId })
        .from(itemTags)
        .where(inArray(itemTags.tagId, tagIds))
        .groupBy(itemTags.itemId)
        .having(sql`count(distinct ${itemTags.tagId}) = ${tagIds.length}`);

      if (itemsWithAllTags.length === 0) {
        return NextResponse.json({ items: [], total: 0, page, limit, pages: 0 });
      }

      tagFilteredItemIds = itemsWithAllTags.map((r) => r.itemId);
    }
  }

  if (tagFilteredItemIds !== null) {
    conditions.push(inArray(items.id, tagFilteredItemIds));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Determine order
  const orderBy =
    sort === 'oldest'
      ? asc(items.createdAt)
      : sort === 'alphabetical'
        ? sql`${items.title} ASC NULLS LAST`
        : desc(items.createdAt);

  // Count total
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(items)
    .where(whereClause);

  const total = count;
  const pages = Math.ceil(total / limit);

  // Fetch page of results (exclude embedding)
  const rows = await db
    .select({
      id: items.id,
      url: items.url,
      sourceType: items.sourceType,
      title: items.title,
      author: items.author,
      publishedAt: items.publishedAt,
      summary: items.summary,
      keyInsights: items.keyInsights,
      categoryId: items.categoryId,
      processingStatus: items.processingStatus,
      captureSource: items.captureSource,
      userNotes: items.userNotes,
      isFavorite: items.isFavorite,
      readCount: items.readCount,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt,
    })
    .from(items)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ items: rows, total, page, limit, pages });
}
