import { NextRequest, NextResponse } from 'next/server';
import { sql, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get('days') ?? '30', 10), 7), 90);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const rows = await db
      .select({
        date: sql<string>`date_trunc('day', ${items.createdAt})::date::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(items)
      .where(gt(items.createdAt, cutoff))
      .groupBy(sql`date_trunc('day', ${items.createdAt})`)
      .orderBy(sql`date_trunc('day', ${items.createdAt})`);

    return NextResponse.json({ days, data: rows });
  } catch (error) {
    console.error('Analytics timeline error:', error);
    return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 });
  }
}
