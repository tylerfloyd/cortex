'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ItemsLineChart } from './ItemsLineChart'
import { SourcePieChart } from './SourcePieChart'
import { CategoryBarChart } from './CategoryBarChart'
import { TagCloud } from './TagCloud'

type SourceData = {
  source_type: string
  count: number
}

type CategoryData = {
  name: string
  color: string | null
  count: number
}

type DateData = {
  date: string
  count: number
}

type TagData = {
  name: string
  slug: string
  count: number | null
}

type ReadStats = {
  total_saved: number
  total_read: number
  read_rate: number
}

export type AnalyticsData = {
  total_items: number
  items_this_week: number
  items_this_month: number
  by_source_type: SourceData[]
  by_category: CategoryData[]
  items_by_date: DateData[]
  top_tags: TagData[]
  read_stats: ReadStats
  estimated_cost_usd: number
}

type Props = {
  data: AnalyticsData
}

export function AnalyticsDashboard({ data }: Props) {
  const readPct = Math.round(data.read_stats.read_rate * 100)

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">Insights into your knowledge base.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.total_items}</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.items_this_week}</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.items_this_month}</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
              Est. API Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${data.estimated_cost_usd.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">OpenRouter estimate</p>
          </CardContent>
        </Card>
      </div>

      {/* Items over time */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Items Saved — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemsLineChart data={data.items_by_date} />
          </CardContent>
        </Card>
      </section>

      {/* Source type + Categories */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Source Type</CardTitle>
          </CardHeader>
          <CardContent>
            <SourcePieChart data={data.by_source_type} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Active Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBarChart data={data.by_category} />
          </CardContent>
        </Card>
      </div>

      {/* Tag cloud */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tag Cloud</CardTitle>
          </CardHeader>
          <CardContent>
            <TagCloud tags={data.top_tags} />
          </CardContent>
        </Card>
      </section>

      {/* Reading stats + Cost breakdown */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reading Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Items saved</span>
              <span className="text-sm font-semibold">{data.read_stats.total_saved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Items accessed</span>
              <span className="text-sm font-semibold">{data.read_stats.total_read}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Read rate</span>
              <span className="text-sm font-semibold">{readPct}%</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${readPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {data.read_stats.total_read} of {data.read_stats.total_saved} items have been
              opened at least once.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost Estimation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Processed items</span>
              <span className="text-sm font-semibold">{data.total_items}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total estimated cost</span>
              <span className="text-lg font-bold">${data.estimated_cost_usd.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Estimate based on ~2,000 input + 500 output tokens per summarization,
              plus categorization and embedding costs. Actual spend may vary.
            </p>
            <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
              <p className="font-medium text-foreground mb-1">Pricing used:</p>
              <p>Claude Sonnet: $3/$15 per 1M tokens</p>
              <p>Claude Haiku: $0.80/$4 per 1M tokens</p>
              <p>Embeddings: $0.02 per 1M tokens</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
