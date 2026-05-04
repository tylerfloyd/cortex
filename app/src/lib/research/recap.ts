import { db } from '@/lib/db'
import { items, weeklyRecaps } from '@/lib/db/schema'
import { eq, gte, desc, sql } from 'drizzle-orm'
import { chatCompletion, getModel } from '@/lib/ai/openrouter'

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  // Monday = start of week
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export async function getOrGenerateRecap() {
  const weekStart = getWeekStart()
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const [existing] = await db
    .select()
    .from(weeklyRecaps)
    .where(eq(weeklyRecaps.weekStarting, weekStartStr))
    .limit(1)
  if (existing) return existing

  const weekItems = await db
    .select({
      id: items.id,
      title: items.title,
      summary: items.summary,
      sourceType: items.sourceType,
      captureSource: items.captureSource,
      createdAt: items.createdAt,
    })
    .from(items)
    .where(gte(items.createdAt, weekStart))
    .orderBy(desc(items.createdAt))
    .limit(50)

  if (weekItems.length < 3) return null

  const itemList = weekItems
    .map(i => `[${i.id}] ${i.title ?? 'Untitled'}: ${(i.summary ?? '').slice(0, 150)}`)
    .join('\n')

  const prompt = `You are a knowledge base analyst. Here are the items saved this week:\n\n${itemList}\n\nProvide a JSON response with:
{
  "summary": "3-4 sentence narrative overview of what themes dominated this week",
  "themes": [{ "label": "theme name", "description": "one sentence", "itemCount": N }],
  "topPickIds": ["id1", "id2", "id3", "id4", "id5"]
}
Only include item IDs from the list above for topPickIds. Return at most 5 top picks.`

  try {
    const model = await getModel('chat')
    const raw = await chatCompletion(
      model,
      [{ role: 'user', content: prompt }],
      { jsonMode: true }
    )
    const parsed = JSON.parse(raw) as {
      summary: string
      themes: Array<{ label: string; description: string; itemCount: number }>
      topPickIds: string[]
    }

    const [recap] = await db
      .insert(weeklyRecaps)
      .values({
        weekStarting: weekStartStr,
        summary: parsed.summary ?? '',
        topPickIds: (parsed.topPickIds ?? []).slice(0, 5),
        themes: parsed.themes ?? [],
      })
      .returning()

    return recap
  } catch {
    return null
  }
}

export async function getWeekStats(weekStart: Date) {
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      fromAgent: sql<number>`count(*) filter (where capture_source = 'research-agent')::int`,
    })
    .from(items)
    .where(gte(items.createdAt, weekStart))

  return totals
}
