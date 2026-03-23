import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { categories, items } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';
import { slugify } from '@/lib/slugify';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  is_ai_suggested: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { id } = await params;

  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, description, color, parent_id, is_ai_suggested } = parsed.data;

  // Validate parent exists if provided and not null
  if (parent_id !== undefined && parent_id !== null) {
    if (parent_id === id) {
      return NextResponse.json(
        { error: 'Category cannot be its own parent' },
        { status: 400 },
      );
    }
    const parent = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, parent_id))
      .limit(1);
    if (parent.length === 0) {
      return NextResponse.json({ error: 'Parent category not found' }, { status: 404 });
    }
  }

  const updateValues: Record<string, unknown> = {};
  if (name !== undefined) {
    updateValues.name = name;
    updateValues.slug = slugify(name);
  }
  if (description !== undefined) updateValues.description = description;
  if (color !== undefined) updateValues.color = color;
  if (parent_id !== undefined) updateValues.parentId = parent_id;
  if (is_ai_suggested !== undefined) updateValues.isAiSuggested = is_ai_suggested;

  try {
    const [updated] = await db
      .update(categories)
      .set(updateValues)
      .where(eq(categories.id, id))
      .returning();

    return NextResponse.json(updated);
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
    console.error('[categories PUT] error:', err);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { id } = await params;

  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  // Count items in this category
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(items)
    .where(eq(items.categoryId, id));

  const itemCount = countRow?.count ?? 0;

  if (itemCount > 0) {
    // Require reassign_to query param
    const reassignTo = request.nextUrl.searchParams.get('reassign_to');
    if (!reassignTo) {
      return NextResponse.json(
        {
          error: 'Category has items. Provide reassign_to query param with target category id, or use "none" to unassign.',
          item_count: itemCount,
        },
        { status: 409 },
      );
    }

    if (reassignTo !== 'none') {
      // Validate target category exists before starting the transaction
      const target = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, reassignTo))
        .limit(1);

      if (target.length === 0) {
        return NextResponse.json(
          { error: 'Reassign target category not found' },
          { status: 404 },
        );
      }

      await db.transaction(async (tx) => {
        await tx.update(items).set({ categoryId: reassignTo }).where(eq(items.categoryId, id));
        await tx.delete(categories).where(eq(categories.id, id));
      });
    } else {
      // Unassign items from category then delete
      await db.transaction(async (tx) => {
        await tx.update(items).set({ categoryId: null }).where(eq(items.categoryId, id));
        await tx.delete(categories).where(eq(categories.id, id));
      });
    }

    return NextResponse.json({ deleted: true, id });
  }

  await db.delete(categories).where(eq(categories.id, id));

  return NextResponse.json({ deleted: true, id });
}
