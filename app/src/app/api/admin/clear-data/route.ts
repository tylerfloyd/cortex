import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Require explicit confirmation flag
  if (
    typeof body !== 'object' ||
    body === null ||
    (body as Record<string, unknown>)['confirm'] !== true
  ) {
    return NextResponse.json(
      { error: 'Must send { "confirm": true } to clear all data' },
      { status: 400 },
    );
  }

  // Delete all items (cascades to item_tags and item_relations)
  await db.delete(items);

  return NextResponse.json({ cleared: true });
}
