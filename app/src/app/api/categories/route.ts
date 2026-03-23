import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { categories, items } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';
import { slugify } from '@/lib/slugify';

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      color: categories.color,
      parentId: categories.parentId,
      isAiSuggested: categories.isAiSuggested,
      createdAt: categories.createdAt,
      itemCount: sql<number>`count(${items.id})::int`,
    })
    .from(categories)
    .leftJoin(items, eq(items.categoryId, categories.id))
    .groupBy(
      categories.id,
      categories.name,
      categories.slug,
      categories.description,
      categories.color,
      categories.parentId,
      categories.isAiSuggested,
      categories.createdAt,
    )
    .orderBy(categories.name);

  return NextResponse.json({ categories: rows });
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().optional(),
  parent_id: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, description, color, parent_id } = parsed.data;
  const slug = slugify(name);

  // Validate parent exists if provided
  if (parent_id) {
    const parent = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, parent_id))
      .limit(1);
    if (parent.length === 0) {
      return NextResponse.json({ error: 'Parent category not found' }, { status: 404 });
    }
  }

  try {
    const [created] = await db
      .insert(categories)
      .values({
        name,
        slug,
        description: description ?? null,
        color: color ?? null,
        parentId: parent_id ?? null,
        isAiSuggested: false,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === '23505'
    ) {
      return NextResponse.json(
        { error: 'A category with that name already exists' },
        { status: 409 },
      );
    }
    console.error('[categories POST] error:', err);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
