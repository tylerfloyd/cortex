export const dynamic = 'force-dynamic'

import { getOrGenerateRecap, getWeekStats } from '@/lib/research/recap'
import { db } from '@/lib/db'
import { items, researchRuns } from '@/lib/db/schema'
import { inArray, desc, gte } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { relativeTime } from '@/lib/format'

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export default async function RecapPage() {
  const weekStart = getWeekStart()

  const [recap, stats, recentRuns] = await Promise.all([
    getOrGenerateRecap(),
    getWeekStats(weekStart),
    db.select().from(researchRuns).orderBy(desc(researchRuns.startedAt)).limit(5),
  ])

  const topPicks = recap?.topPickIds?.length
    ? await db
        .select({ id: items.id, title: items.title, url: items.url, sourceType: items.sourceType })
        .from(items)
        .where(inArray(items.id, recap.topPickIds))
    : []

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Weekly Recap</h1>
        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{stats?.total ?? 0}</strong> items this week
          </span>
          {(stats?.fromAgent ?? 0) > 0 && (
            <span>
              <strong className="text-foreground">{stats.fromAgent}</strong> from research agent
            </span>
          )}
        </div>
      </div>

      {!recap ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            Not enough content this week to generate a recap yet. Save at least 3 items to get started.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle>This Week</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{recap.summary}</p>
            </CardContent>
          </Card>

          {(recap.themes as Array<{ label: string; description: string; itemCount: number }>).length > 0 && (
            <section>
              <h2 className="text-base font-semibold mb-3">Themes</h2>
              <div className="space-y-2">
                {(recap.themes as Array<{ label: string; description: string; itemCount: number }>).map((theme, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
                    <Badge variant="secondary" className="shrink-0">{theme.label}</Badge>
                    <p className="text-sm text-muted-foreground">{theme.description}</p>
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">{theme.itemCount} items</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {topPicks.length > 0 && (
            <section>
              <h2 className="text-base font-semibold mb-3">Top Picks</h2>
              <Card>
                <CardContent className="p-0">
                  {topPicks.map(item => (
                    <Link
                      key={item.id}
                      href={`/library/${item.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 first:rounded-t-xl last:rounded-b-xl text-sm group border-b last:border-0"
                    >
                      <span className="flex-1 truncate group-hover:text-primary">
                        {item.title ?? item.url}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0">{item.sourceType}</Badge>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </section>
          )}
        </>
      )}

      {recentRuns.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3">Recent Agent Runs</h2>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y text-sm">
                {recentRuns.map(run => (
                  <li key={run.id} className="flex items-center gap-4 px-4 py-2.5 flex-wrap">
                    <span className="text-muted-foreground shrink-0">{relativeTime(run.startedAt)}</span>
                    <span className="shrink-0">
                      <strong>{run.itemsIngested}</strong> ingested /&nbsp;
                      <strong>{run.itemsFound}</strong> found
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(run.sources as string[]).join(', ')}
                    </span>
                    {run.error && (
                      <span className="text-xs text-destructive ml-auto">Error: {run.error.slice(0, 60)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
