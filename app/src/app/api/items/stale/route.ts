import { NextRequest, NextResponse } from 'next/server';
import { and, eq, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, categories } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';

const DEFAULT_MONTHS = 6;

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const monthsParam = request.nextUrl.searchParams.get('months');
  const months = Math.max(1, parseInt(monthsParam ?? String(DEFAULT_MONTHS), 10) || DEFAULT_MONTHS);

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const rows = await db
    .select({
      id: items.id,
      title: items.title,
      url: items.url,
      sourceType: items.sourceType,
      summary: items.summary,
      createdAt: items.createdAt,
      readCount: items.readCount,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(
      and(
        eq(items.processingStatus, 'completed'),
        eq(items.readCount, 0),
        lt(items.createdAt, cutoff)
      )
    )
    .orderBy(items.createdAt)
    .limit(500);

  return NextResponse.json({ stale: rows, months, cutoff: cutoff.toISOString() });
}
