# AI Research Agent & Weekly Recap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an autonomous daily research agent that fetches curated content from Reddit, Hacker News, YouTube, and Twitter/X (optional), runs it through an AI relevance filter, and ingests high-signal items into the knowledge base automatically. Add a `/recap` page that synthesises the past week's saved content into themes, highlights, and a narrative summary.

**Architecture:** The research agent is a scheduled BullMQ job in the existing `worker.ts` process — no new services needed. New content flows through the existing ingestion pipeline (extraction → AI processing → embedding). Three new DB tables store source configs, run logs, and cached recap data. New settings section for configuring sources and topics. New `/recap` route for the weekly digest view.

**Tech Stack:** BullMQ (existing), Drizzle ORM + PostgreSQL (existing), OpenRouter / Claude Haiku (existing, for relevance filter and recap generation), Next.js 16 App Router, TypeScript, Node.js `fetch` (for RSS/API calls), `fast-xml-parser` or `@rgrove/parse-xml` (for RSS parsing)

---

## Task 1: Add XML Parser Dependency

The RSS sources (Reddit, YouTube) return XML/Atom feeds. Need a lightweight XML parser.

**Files:**
- Modify: `app/package.json`

**Step 1: Install fast-xml-parser**

```bash
cd app && npm install fast-xml-parser
```

**Step 2: Verify install**

```bash
cd app && node -e "const { XMLParser } = require('fast-xml-parser'); console.log('ok')"
```

Expected: `ok`

**Step 3: Commit**

```bash
git add app/package.json app/package-lock.json
git commit -m "chore: add fast-xml-parser for RSS feed parsing"
```

---

## Task 2: Add DB Schema — Three New Tables

**Files:**
- Create: `app/src/lib/db/schema/research-sources.ts`
- Create: `app/src/lib/db/schema/research-runs.ts`
- Create: `app/src/lib/db/schema/weekly-recaps.ts`
- Modify: `app/src/lib/db/schema/index.ts`

**Step 1: Write failing test for research-sources schema**

Create `app/src/lib/db/__tests__/schema-exports.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { researchSources, researchRuns, weeklyRecaps } from '../schema'

describe('research schema exports', () => {
  it('exports researchSources table', () => {
    expect(researchSources).toBeDefined()
    expect(researchSources.id).toBeDefined()
    expect(researchSources.type).toBeDefined()
    expect(researchSources.config).toBeDefined()
    expect(researchSources.enabled).toBeDefined()
  })

  it('exports researchRuns table', () => {
    expect(researchRuns).toBeDefined()
    expect(researchRuns.itemsFound).toBeDefined()
    expect(researchRuns.itemsIngested).toBeDefined()
  })

  it('exports weeklyRecaps table', () => {
    expect(weeklyRecaps).toBeDefined()
    expect(weeklyRecaps.weekStarting).toBeDefined()
    expect(weeklyRecaps.summary).toBeDefined()
    expect(weeklyRecaps.themes).toBeDefined()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd app && npm run test:run -- src/lib/db/__tests__/schema-exports.test.ts
```

Expected: FAIL — "Cannot find module '../schema' exporting researchSources"

**Step 3: Create research-sources.ts**

```ts
import { pgTable, uuid, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const researchSources = pgTable('research_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(), // 'reddit' | 'hackernews' | 'youtube' | 'twitter'
  name: text('name').notNull(),
  config: jsonb('config').notNull().default('{}'),
  topics: text('topics').array().notNull().default([]),
  enabled: boolean('enabled').notNull().default(true),
  lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

**Step 4: Create research-runs.ts**

```ts
import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const researchRuns = pgTable('research_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  itemsFound: integer('items_found').notNull().default(0),
  itemsIngested: integer('items_ingested').notNull().default(0),
  sources: text('sources').array().notNull().default([]),
  error: text('error'),
})
```

**Step 5: Create weekly-recaps.ts**

```ts
import { pgTable, uuid, date, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const weeklyRecaps = pgTable('weekly_recaps', {
  id: uuid('id').primaryKey().defaultRandom(),
  weekStarting: date('week_starting').notNull().unique(),
  summary: text('summary').notNull(),
  topPickIds: text('top_pick_ids').array().notNull().default([]),
  themes: jsonb('themes').notNull().default('[]'),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
})
```

**Step 6: Export from schema/index.ts**

Add to the bottom of `app/src/lib/db/schema/index.ts`:
```ts
export * from './research-sources'
export * from './research-runs'
export * from './weekly-recaps'
```

**Step 7: Run test to verify it passes**

```bash
cd app && npm run test:run -- src/lib/db/__tests__/schema-exports.test.ts
```

Expected: PASS (3 tests)

**Step 8: Generate and apply migration**

```bash
cd app && npm run db:generate && npm run db:migrate
```

Expected: new migration file created in `app/drizzle/`, migration applied successfully.

**Step 9: Commit**

```bash
git add app/src/lib/db/schema/ app/src/lib/db/__tests__/schema-exports.test.ts app/drizzle/
git commit -m "feat(research): add research_sources, research_runs, weekly_recaps tables"
```

---

## Task 3: AI Relevance Filter

This module scores candidate items for relevance to configured topics using Claude Haiku. It's the core filtering mechanism used by all source integrations.

**Files:**
- Create: `app/src/lib/research/relevance-filter.ts`
- Create: `app/src/lib/research/__tests__/relevance-filter.test.ts`

**Step 1: Write failing test**

```ts
import { describe, it, expect, vi } from 'vitest'

// Mock the openrouter chatCompletion
vi.mock('@/lib/ai/openrouter', () => ({
  chatCompletion: vi.fn().mockResolvedValue(
    JSON.stringify({ score: 8, reason: 'Directly relevant to LLMs' })
  ),
}))

import { scoreRelevance } from '../relevance-filter'

describe('scoreRelevance', () => {
  it('returns score and reason for relevant content', async () => {
    const result = await scoreRelevance(
      { title: 'GPT-5 released', description: 'OpenAI releases new model' },
      ['AI', 'LLMs', 'machine learning']
    )
    expect(result.score).toBe(8)
    expect(result.reason).toBe('Directly relevant to LLMs')
  })

  it('returns score 0 on parse error without throwing', async () => {
    const { chatCompletion } = await import('@/lib/ai/openrouter')
    vi.mocked(chatCompletion).mockResolvedValueOnce('not json')

    const result = await scoreRelevance(
      { title: 'Recipe blog', description: 'How to make pasta' },
      ['AI', 'technology']
    )
    expect(result.score).toBe(0)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd app && npm run test:run -- src/lib/research/__tests__/relevance-filter.test.ts
```

Expected: FAIL — "Cannot find module '../relevance-filter'"

**Step 3: Implement relevance-filter.ts**

```ts
import { chatCompletion } from '@/lib/ai/openrouter'

type Candidate = { title: string; description?: string | null }
type ScoreResult = { score: number; reason: string }

export async function scoreRelevance(
  candidate: Candidate,
  topics: string[]
): Promise<ScoreResult> {
  const topicList = topics.join(', ')
  const content = [candidate.title, candidate.description].filter(Boolean).join(' — ')

  const prompt = `You are a research relevance judge. Rate how relevant the following content is to these topics: ${topicList}

Content: "${content}"

Respond with JSON only: { "score": <0-10>, "reason": "<one sentence>" }
A score of 0 means completely irrelevant. A score of 10 means directly on-topic.`

  try {
    const raw = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { model: 'anthropic/claude-haiku-4-5', jsonMode: true }
    )
    const parsed = JSON.parse(raw) as { score: number; reason: string }
    return { score: parsed.score ?? 0, reason: parsed.reason ?? '' }
  } catch {
    return { score: 0, reason: 'parse error' }
  }
}

export function isRelevant(result: ScoreResult, threshold = 6): boolean {
  return result.score >= threshold
}
```

Note: The `chatCompletion` function needs to accept an optional `model` override. Check `app/src/lib/ai/openrouter.ts` — if it doesn't accept a model param, add an optional `model?: string` to `ChatCompletionOptions` and use it in the fetch call.

**Step 4: Run test to verify it passes**

```bash
cd app && npm run test:run -- src/lib/research/__tests__/relevance-filter.test.ts
```

Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add app/src/lib/research/
git commit -m "feat(research): add AI relevance filter using Claude Haiku"
```

---

## Task 4: Reddit RSS Fetcher

**Files:**
- Create: `app/src/lib/research/sources/reddit.ts`
- Create: `app/src/lib/research/sources/__tests__/reddit.test.ts`

**Step 1: Write failing test**

```ts
import { describe, it, expect, vi } from 'vitest'

// Mock global fetch
global.fetch = vi.fn()

import { fetchRedditPosts } from '../reddit'

describe('fetchRedditPosts', () => {
  it('returns parsed posts from RSS feed', async () => {
    const mockRss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title><![CDATA[Interesting AI paper]]></title>
      <link>https://arxiv.org/abs/1234</link>
      <description><![CDATA[A great paper about transformers with 500 points]]></description>
    </item>
  </channel>
</rss>`

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockRss),
    } as Response)

    const posts = await fetchRedditPosts('MachineLearning')
    expect(posts).toHaveLength(1)
    expect(posts[0].title).toBe('Interesting AI paper')
    expect(posts[0].url).toBe('https://arxiv.org/abs/1234')
  })

  it('returns empty array on fetch failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 429 } as Response)
    const posts = await fetchRedditPosts('MachineLearning')
    expect(posts).toEqual([])
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd app && npm run test:run -- src/lib/research/sources/__tests__/reddit.test.ts
```

Expected: FAIL

**Step 3: Implement reddit.ts**

```ts
import { XMLParser } from 'fast-xml-parser'

export type RssPost = {
  title: string
  url: string
  description: string | null
}

const parser = new XMLParser({ ignoreAttributes: false, cdataPropName: '__cdata' })

export async function fetchRedditPosts(subreddit: string, limit = 25): Promise<RssPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/top.rss?t=day&limit=${limit}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Cortex-ResearchAgent/1.0' },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const parsed = parser.parse(xml)
    const items: unknown[] = parsed?.rss?.channel?.item ?? []
    return (Array.isArray(items) ? items : [items])
      .map((item: unknown) => {
        const i = item as Record<string, unknown>
        const title = (i['title'] as { __cdata?: string } | string)?.__cdata
          ?? (i['title'] as string) ?? ''
        const link = (i['link'] as string) ?? ''
        const desc = (i['description'] as { __cdata?: string } | string)?.__cdata
          ?? (i['description'] as string) ?? null
        return { title, url: link, description: desc }
      })
      .filter(p => p.title && p.url)
  } catch {
    return []
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd app && npm run test:run -- src/lib/research/sources/__tests__/reddit.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add app/src/lib/research/sources/
git commit -m "feat(research): add Reddit RSS fetcher"
```

---

## Task 5: Hacker News Fetcher

**Files:**
- Create: `app/src/lib/research/sources/hackernews.ts`
- Create: `app/src/lib/research/sources/__tests__/hackernews.test.ts`

**Step 1: Write failing test**

```ts
import { describe, it, expect, vi } from 'vitest'

global.fetch = vi.fn()

import { fetchHackerNewsStories } from '../hackernews'

describe('fetchHackerNewsStories', () => {
  it('returns stories with url and title', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        hits: [
          { objectID: '1', title: 'New JS framework', url: 'https://example.com', points: 150 },
          { objectID: '2', title: 'Low points story', url: 'https://example2.com', points: 30 },
        ]
      })
    } as Response)

    const stories = await fetchHackerNewsStories({ minPoints: 100 })
    expect(stories).toHaveLength(1)
    expect(stories[0].title).toBe('New JS framework')
    expect(stories[0].url).toBe('https://example.com')
  })

  it('falls back to item URL for Ask HN stories without external URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        hits: [{ objectID: '3', title: 'Ask HN: discuss', url: null, points: 200 }]
      })
    } as Response)

    const stories = await fetchHackerNewsStories({ minPoints: 100 })
    expect(stories[0].url).toBe('https://news.ycombinator.com/item?id=3')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd app && npm run test:run -- src/lib/research/sources/__tests__/hackernews.test.ts
```

Expected: FAIL

**Step 3: Implement hackernews.ts**

```ts
type HnStory = { title: string; url: string; description: string | null }

export async function fetchHackerNewsStories(
  opts: { minPoints?: number; limit?: number } = {}
): Promise<HnStory[]> {
  const { minPoints = 100, limit = 30 } = opts
  const url = `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=${limit}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json() as { hits: Array<{ objectID: string; title: string; url: string | null; points: number }> }
    return data.hits
      .filter(h => h.points >= minPoints)
      .map(h => ({
        title: h.title,
        url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
        description: null,
      }))
  } catch {
    return []
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd app && npm run test:run -- src/lib/research/sources/__tests__/hackernews.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add app/src/lib/research/sources/hackernews.ts app/src/lib/research/sources/__tests__/hackernews.test.ts
git commit -m "feat(research): add Hacker News Algolia fetcher"
```

---

## Task 6: YouTube RSS Fetcher

**Files:**
- Create: `app/src/lib/research/sources/youtube.ts`
- Create: `app/src/lib/research/sources/__tests__/youtube.test.ts`

**Step 1: Write failing test**

```ts
import { describe, it, expect, vi } from 'vitest'

global.fetch = vi.fn()

import { fetchYouTubeVideos } from '../youtube'

describe('fetchYouTubeVideos', () => {
  it('returns videos published in the last 24 hours', async () => {
    const recentDate = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const mockAtom = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Recent Video</title>
    <link href="https://youtube.com/watch?v=abc"/>
    <published>${recentDate}</published>
  </entry>
  <entry>
    <title>Old Video</title>
    <link href="https://youtube.com/watch?v=xyz"/>
    <published>${oldDate}</published>
  </entry>
</feed>`

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockAtom),
    } as Response)

    const videos = await fetchYouTubeVideos('UC_channel_id_here')
    expect(videos).toHaveLength(1)
    expect(videos[0].title).toBe('Recent Video')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd app && npm run test:run -- src/lib/research/sources/__tests__/youtube.test.ts
```

Expected: FAIL

**Step 3: Implement youtube.ts**

```ts
import { XMLParser } from 'fast-xml-parser'

type YtVideo = { title: string; url: string; description: string | null }

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

export async function fetchYouTubeVideos(
  channelId: string,
  maxAgeHours = 24
): Promise<YtVideo[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)

  try {
    const res = await fetch(feedUrl)
    if (!res.ok) return []
    const xml = await res.text()
    const parsed = parser.parse(xml)
    const entries: unknown[] = parsed?.feed?.entry ?? []
    return (Array.isArray(entries) ? entries : [entries])
      .map((e: unknown) => {
        const entry = e as Record<string, unknown>
        const published = new Date((entry['published'] as string) ?? 0)
        if (published < cutoff) return null
        const linkAttr = (entry['link'] as Record<string, unknown> | undefined)?.['@_href'] as string ?? ''
        return {
          title: (entry['title'] as string) ?? '',
          url: linkAttr,
          description: null,
        }
      })
      .filter((v): v is YtVideo => v !== null && Boolean(v.title) && Boolean(v.url))
  } catch {
    return []
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd app && npm run test:run -- src/lib/research/sources/__tests__/youtube.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add app/src/lib/research/sources/youtube.ts app/src/lib/research/sources/__tests__/youtube.test.ts
git commit -m "feat(research): add YouTube channel RSS fetcher"
```

---

## Task 7: Twitter/X Fetcher (Optional)

This module is skipped entirely if the env vars are not set — no error, no crash.

**Files:**
- Create: `app/src/lib/research/sources/twitter.ts`

**Step 1: Implement twitter.ts**

No test needed for the API call itself (network-dependent), but the graceful skip behavior is important.

```ts
type Tweet = { title: string; url: string; description: string | null }

export async function fetchTwitterTimeline(): Promise<Tweet[]> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  const accessToken = process.env.TWITTER_USER_ACCESS_TOKEN
  const userId = process.env.TWITTER_USER_ID

  if (!bearerToken || !accessToken || !userId) {
    // Optional source — silently skip if not configured
    return []
  }

  try {
    const res = await fetch(
      `https://api.twitter.com/2/users/${userId}/timelines/reverse_chronological?max_results=50&tweet.fields=text,created_at,entities&expansions=attachments.media_keys&exclude=retweets`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) {
      console.warn('[twitter] API returned', res.status)
      return []
    }
    const data = await res.json() as { data?: Array<{ id: string; text: string; entities?: { urls?: Array<{ expanded_url: string }> } }> }
    return (data.data ?? []).map(tweet => {
      const externalUrl = tweet.entities?.urls?.[0]?.expanded_url
      return {
        title: tweet.text.slice(0, 120),
        url: externalUrl ?? `https://twitter.com/i/web/status/${tweet.id}`,
        description: tweet.text,
      }
    })
  } catch (err) {
    console.error('[twitter] fetch failed:', err)
    return []
  }
}
```

**Step 2: Add env var docs to CLAUDE.md**

In `app/CLAUDE.md`, under Required Env Vars, add an "Optional" section:
```
TWITTER_BEARER_TOKEN       Twitter API v2 Bearer Token (research agent, optional)
TWITTER_USER_ACCESS_TOKEN  OAuth 2.0 user access token for home timeline (optional)
TWITTER_USER_ID            Your Twitter numeric user ID (optional)
```

**Step 3: Commit**

```bash
git add app/src/lib/research/sources/twitter.ts app/CLAUDE.md
git commit -m "feat(research): add Twitter/X timeline fetcher (optional, skipped if tokens not set)"
```

---

## Task 8: Research Agent Orchestrator

**Files:**
- Create: `app/src/lib/research/agent.ts`
- Create: `app/src/lib/research/__tests__/agent.test.ts`

**Step 1: Write failing test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../sources/reddit', () => ({ fetchRedditPosts: vi.fn().mockResolvedValue([
  { title: 'AI paper', url: 'https://example.com/paper', description: 'Great AI content' }
]) }))
vi.mock('../sources/hackernews', () => ({ fetchHackerNewsStories: vi.fn().mockResolvedValue([]) }))
vi.mock('../sources/youtube', () => ({ fetchYouTubeVideos: vi.fn().mockResolvedValue([]) }))
vi.mock('../sources/twitter', () => ({ fetchTwitterTimeline: vi.fn().mockResolvedValue([]) }))
vi.mock('../relevance-filter', () => ({
  scoreRelevance: vi.fn().mockResolvedValue({ score: 8, reason: 'relevant' }),
  isRelevant: vi.fn().mockReturnValue(true),
}))
vi.mock('@/lib/db', () => ({ db: { select: vi.fn(), insert: vi.fn() } }))

import { runResearchAgent, type ResearchAgentConfig } from '../agent'

describe('runResearchAgent', () => {
  it('returns run summary with items found and ingested counts', async () => {
    // Mock db.select to return one reddit source
    const { db } = await import('@/lib/db')
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{
          id: 'source-1',
          type: 'reddit',
          name: 'r/MachineLearning',
          config: { subreddit: 'MachineLearning' },
          topics: ['AI', 'machine learning'],
          enabled: true,
          lastFetchedAt: null,
        }])
      })
    } as never)
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue(undefined) })
    } as never)

    const config: ResearchAgentConfig = { dryRun: true }
    const result = await runResearchAgent(config)

    expect(result.itemsFound).toBeGreaterThanOrEqual(0)
    expect(result.sources).toContain('reddit')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd app && npm run test:run -- src/lib/research/__tests__/agent.test.ts
```

Expected: FAIL

**Step 3: Implement agent.ts**

```ts
import { db } from '@/lib/db'
import { researchSources, researchRuns } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { fetchRedditPosts } from './sources/reddit'
import { fetchHackerNewsStories } from './sources/hackernews'
import { fetchYouTubeVideos } from './sources/youtube'
import { fetchTwitterTimeline } from './sources/twitter'
import { scoreRelevance, isRelevant } from './relevance-filter'
import { extractionQueue } from '@/lib/queue'

export type ResearchAgentConfig = { dryRun?: boolean }
export type RunSummary = { itemsFound: number; itemsIngested: number; sources: string[] }

type Candidate = { title: string; url: string; description: string | null }

export async function runResearchAgent(config: ResearchAgentConfig = {}): Promise<RunSummary> {
  const { dryRun = false } = config
  const startedAt = new Date()
  let itemsFound = 0
  let itemsIngested = 0
  const usedSources: string[] = []

  const sources = await db.select().from(researchSources).where(eq(researchSources.enabled, true))

  // Always run HN (no config needed)
  const hnStories = await fetchHackerNewsStories({ minPoints: 100 })
  if (hnStories.length > 0) usedSources.push('hackernews')

  // Source-specific fetches
  const redditSources = sources.filter(s => s.type === 'reddit')
  const youtubeSources = sources.filter(s => s.type === 'youtube')

  const redditPosts: Candidate[] = []
  for (const src of redditSources) {
    const cfg = src.config as { subreddit?: string }
    if (cfg.subreddit) {
      const posts = await fetchRedditPosts(cfg.subreddit)
      redditPosts.push(...posts)
    }
  }
  if (redditPosts.length > 0) usedSources.push('reddit')

  const ytVideos: Candidate[] = []
  for (const src of youtubeSources) {
    const cfg = src.config as { channelId?: string }
    if (cfg.channelId) {
      const videos = await fetchYouTubeVideos(cfg.channelId)
      ytVideos.push(...videos)
    }
  }
  if (ytVideos.length > 0) usedSources.push('youtube')

  const tweets = await fetchTwitterTimeline()
  if (tweets.length > 0) usedSources.push('twitter')

  const allCandidates = [...hnStories, ...redditPosts, ...ytVideos, ...tweets]
  itemsFound = allCandidates.length

  // Get all configured topics across all sources
  const allTopics = Array.from(new Set(sources.flatMap(s => s.topics as string[])))
  const topics = allTopics.length > 0 ? allTopics : ['technology', 'AI', 'programming']

  // Filter and ingest
  for (const candidate of allCandidates) {
    const relevance = await scoreRelevance(candidate, topics)
    if (!isRelevant(relevance)) continue
    if (!dryRun) {
      try {
        await extractionQueue.add('research-ingest', { url: candidate.url, source: 'research-agent' }, {
          jobId: `research-${Buffer.from(candidate.url).toString('base64').slice(0, 32)}`,
        })
        itemsIngested++
      } catch {
        // URL already queued — skip
      }
    } else {
      itemsIngested++
    }
  }

  // Log run
  if (!dryRun) {
    await db.insert(researchRuns).values({
      startedAt,
      completedAt: new Date(),
      itemsFound,
      itemsIngested,
      sources: usedSources,
    })
    // Update lastFetchedAt for all enabled sources
    for (const src of sources) {
      await db.update(researchSources)
        .set({ lastFetchedAt: new Date() })
        .where(eq(researchSources.id, src.id))
    }
  }

  return { itemsFound, itemsIngested, sources: usedSources }
}
```

**Step 4: Run test to verify it passes**

```bash
cd app && npm run test:run -- src/lib/research/__tests__/agent.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add app/src/lib/research/agent.ts app/src/lib/research/__tests__/agent.test.ts
git commit -m "feat(research): add research agent orchestrator"
```

---

## Task 9: Add Scheduled BullMQ Job to Worker

**Files:**
- Modify: `app/worker.ts`

**Step 1: Read the current worker.ts**

Read the full file to understand how existing queues/workers are set up.

**Step 2: Add research agent worker and scheduler**

Add at the end of `worker.ts`, following the same pattern as existing workers:

```ts
import { runResearchAgent } from '@/lib/research/agent'

// Research agent worker
const researchWorker = new Worker(
  'research-agent',
  async () => {
    console.log('[research-agent] starting run')
    const summary = await runResearchAgent()
    console.log('[research-agent] done:', summary)
  },
  { connection: redisConnection }
)

// Schedule daily at 6am (override via RESEARCH_CRON env var)
const researchCron = process.env.RESEARCH_CRON ?? '0 6 * * *'
const researchQueue = new Queue('research-agent', { connection: redisConnection })
await researchQueue.add(
  'daily-run',
  {},
  {
    repeat: { pattern: researchCron },
    jobId: 'research-agent-daily',
  }
)
console.log(`[research-agent] scheduled: ${researchCron}`)
```

**Step 3: Add RESEARCH_CRON to env documentation**

In `app/CLAUDE.md` optional env vars section:
```
RESEARCH_CRON   Cron schedule for research agent (default: "0 6 * * *" = 6am daily)
```

**Step 4: Verify TypeScript compiles**

```bash
cd app && npx tsc --noEmit
```

Expected: no errors

**Step 5: Commit**

```bash
git add app/worker.ts app/CLAUDE.md
git commit -m "feat(research): add daily scheduled BullMQ job for research agent"
```

---

## Task 10: Manual Trigger API Route

**Files:**
- Create: `app/src/app/api/research/run/route.ts`

**Step 1: Implement the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiKey } from '@/lib/auth/api-key'
import { Queue } from 'bullmq'
import { redisConnection } from '@/lib/queue/connection'

async function handler(_req: NextRequest) {
  const researchQueue = new Queue('research-agent', { connection: redisConnection })
  await researchQueue.add('manual-run', {}, { jobId: `manual-${Date.now()}` })
  return NextResponse.json({ ok: true, message: 'Research agent run queued' })
}

export const POST = withApiKey(handler)
```

**Step 2: Commit**

```bash
git add app/src/app/api/research/run/route.ts
git commit -m "feat(research): add POST /api/research/run manual trigger endpoint"
```

---

## Task 11: Settings UI — Research Sources Section

**Files:**
- Modify: `app/src/app/(dashboard)/settings/page.tsx`

**Step 1: Read the current settings page**

Read the full settings page to understand the existing layout/form patterns.

**Step 2: Add Research Agent section**

Add a "Research Agent" section to the settings page with:
- Topics field (comma-separated text input, stored as `topics` array on sources)
- Sources table: list existing `research_sources` rows with enable/disable toggle
- "Add Reddit" form: text input for subreddit name + "Add" button
- "Add YouTube" form: text input for channel ID + "Add" button  
- HN: static row showing "Hacker News — always enabled"
- Twitter: static row showing "Twitter/X — configure tokens in .env" with a link to docs

Use existing form patterns from the settings page. This section makes API calls to new endpoints (Task 12).

**Step 3: Commit**

```bash
git add app/src/app/(dashboard)/settings/
git commit -m "feat(research): add Research Agent section to settings page"
```

---

## Task 12: Settings API Routes for Sources

**Files:**
- Create: `app/src/app/api/research/sources/route.ts`

**Step 1: Implement CRUD routes**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiKey } from '@/lib/auth/api-key'
import { db } from '@/lib/db'
import { researchSources } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function getSources(_req: NextRequest) {
  const sources = await db.select().from(researchSources).orderBy(researchSources.createdAt)
  return NextResponse.json(sources)
}

async function createSource(req: NextRequest) {
  const body = await req.json() as { type: string; name: string; config: object; topics?: string[] }
  const [source] = await db.insert(researchSources)
    .values({ type: body.type, name: body.name, config: body.config, topics: body.topics ?? [] })
    .returning()
  return NextResponse.json(source, { status: 201 })
}

export const GET = withApiKey(getSources)
export const POST = withApiKey(createSource)
```

Also create `app/src/app/api/research/sources/[id]/route.ts` for PATCH (toggle enabled) and DELETE.

**Step 2: Commit**

```bash
git add app/src/app/api/research/
git commit -m "feat(research): add API routes for managing research sources"
```

---

## Task 13: Weekly Recap Page

**Files:**
- Create: `app/src/lib/research/recap.ts`
- Create: `app/src/app/(dashboard)/recap/page.tsx`
- Modify: `app/src/components/layout/Sidebar.tsx` (add Recap to primary nav)

**Step 1: Implement recap generation logic**

```ts
// app/src/lib/research/recap.ts
import { db } from '@/lib/db'
import { items, weeklyRecaps } from '@/lib/db/schema'
import { eq, gte, desc, sql } from 'drizzle-orm'
import { chatCompletion } from '@/lib/ai/openrouter'

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

export async function getOrGenerateRecap() {
  const weekStart = getWeekStart()
  const weekStartStr = weekStart.toISOString().split('T')[0]

  // Return cached recap if exists
  const [existing] = await db.select().from(weeklyRecaps)
    .where(eq(weeklyRecaps.weekStarting, weekStartStr))
    .limit(1)
  if (existing) return existing

  // Fetch this week's items
  const weekItems = await db.select({
    id: items.id,
    title: items.title,
    summary: items.summary,
    sourceType: items.sourceType,
    createdAt: items.createdAt,
  })
    .from(items)
    .where(gte(items.createdAt, weekStart))
    .orderBy(desc(items.createdAt))
    .limit(50)

  if (weekItems.length === 0) {
    return null
  }

  // Generate summary and themes via AI
  const itemList = weekItems
    .map(i => `- ${i.title ?? 'Untitled'}: ${(i.summary ?? '').slice(0, 150)}`)
    .join('\n')

  const prompt = `You are a knowledge base analyst. Here are the items saved this week:\n\n${itemList}\n\nProvide a JSON response with:
{
  "summary": "3-4 sentence narrative overview of what themes dominated this week",
  "themes": [{ "label": "theme name", "description": "one sentence", "itemCount": N }],
  "topPickIds": ["id1", "id2", "id3", "id4", "id5"]
}
Only include item IDs that appear in the list above for topPickIds.`

  try {
    const raw = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { jsonMode: true }
    )
    const parsed = JSON.parse(raw) as { summary: string; themes: object[]; topPickIds: string[] }

    const [recap] = await db.insert(weeklyRecaps).values({
      weekStarting: weekStartStr,
      summary: parsed.summary,
      topPickIds: parsed.topPickIds ?? [],
      themes: parsed.themes ?? [],
    }).returning()

    return recap
  } catch {
    return null
  }
}
```

**Step 2: Implement recap page**

```tsx
// app/src/app/(dashboard)/recap/page.tsx
export const dynamic = 'force-dynamic'

import { getOrGenerateRecap } from '@/lib/research/recap'
import { db } from '@/lib/db'
import { items, researchRuns } from '@/lib/db/schema'
import { eq, inArray, desc, gte, sql } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { relativeTime } from '@/lib/format'

export default async function RecapPage() {
  const recap = await getOrGenerateRecap()

  // Stats for this week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)

  const [{ count: weekCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(items)
    .where(gte(items.createdAt, weekStart))

  const recentRuns = await db.select().from(researchRuns)
    .orderBy(desc(researchRuns.startedAt)).limit(5)

  // Fetch top picks if recap exists
  const topPicks = recap?.topPickIds?.length
    ? await db.select({ id: items.id, title: items.title, url: items.url, sourceType: items.sourceType })
        .from(items).where(inArray(items.id, recap.topPickIds))
    : []

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Weekly Recap</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {weekCount} items saved this week
        </p>
      </div>

      {!recap ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Not enough content this week to generate a recap yet.
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
                    <Badge variant="secondary">{theme.label}</Badge>
                    <p className="text-sm text-muted-foreground">{theme.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {topPicks.length > 0 && (
            <section>
              <h2 className="text-base font-semibold mb-3">Top Picks</h2>
              <div className="space-y-1">
                {topPicks.map(item => (
                  <Link key={item.id} href={`/library/${item.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-accent/50 text-sm group">
                    <span className="flex-1 group-hover:text-primary truncate">{item.title ?? item.url}</span>
                    <Badge variant="outline" className="text-xs shrink-0">{item.sourceType}</Badge>
                  </Link>
                ))}
              </div>
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
                  <li key={run.id} className="flex items-center justify-between px-4 py-2.5 gap-4">
                    <span className="text-muted-foreground">{relativeTime(run.startedAt)}</span>
                    <span>{run.itemsIngested} ingested / {run.itemsFound} found</span>
                    <span className="text-muted-foreground text-xs">{(run.sources as string[]).join(', ')}</span>
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
```

**Step 3: Add Recap to primary nav in Sidebar**

In `Sidebar.tsx`, add to `PRIMARY_NAV`:
```ts
{ href: '/recap', label: 'Recap', icon: Newspaper },
```
Import `Newspaper` from `lucide-react`.

**Step 4: Verify**

Navigate to `/recap`. On first visit it should generate a recap (or show "not enough content"). Verify no TypeScript errors: `cd app && npx tsc --noEmit`

**Step 5: Commit**

```bash
git add app/src/lib/research/recap.ts app/src/app/(dashboard)/recap/
git commit -m "feat(research): add weekly recap page with AI-generated summary and themes"
```

---

## Final Verification

```bash
cd app && npm run test:run
cd app && npx tsc --noEmit
```

Both should pass cleanly. Then:

```bash
git log --oneline -15
```

Review the commit history to confirm all tasks landed cleanly.
