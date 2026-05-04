# Design: AI Research Agent, Weekly Recap & Enhanced Search
**Date:** 2026-05-04
**Status:** Approved

## Goals

1. Autonomous research agent that fetches curated content daily from Reddit, HN, YouTube, and Twitter/X
2. Weekly recap in-app page that synthesizes what was saved and surfaces themes
3. User-configurable research targets (topics, subreddits, YouTube channels)

---

## Architecture Overview

The research agent runs as a scheduled BullMQ job inside the existing `worker.ts` process. No new services are needed. New content is ingested through the existing ingestion pipeline (extraction → AI processing → embedding), so it automatically gets summaries, tags, categories, and semantic embeddings.

```
BullMQ Scheduler (worker.ts)
  └─ research-agent job (daily, configurable time)
       ├─ Reddit: fetch top posts from configured subreddits via RSS
       ├─ Hacker News: fetch top/new stories via Algolia API
       ├─ YouTube: fetch new videos from configured channels via RSS
       └─ Twitter/X: fetch home timeline via API (optional, requires tokens)
            └─ AI relevance filter (OpenRouter)
                 └─ Enqueue matching items → existing extraction/AI pipeline
```

---

## Data Model Changes

### `research_sources` table

Stores user-configured research sources:

```ts
research_sources {
  id: uuid
  type: 'reddit' | 'hackernews' | 'youtube' | 'twitter'
  name: string              // display name, e.g. "r/MachineLearning"
  config: jsonb             // type-specific config (subreddit name, channel id, etc.)
  topics: string[]          // keyword/topic filters for AI relevance scoring
  enabled: boolean
  lastFetchedAt: timestamp
  createdAt: timestamp
}
```

### `research_runs` table

Log of each agent run for visibility/debugging:

```ts
research_runs {
  id: uuid
  startedAt: timestamp
  completedAt: timestamp
  itemsFound: int
  itemsIngested: int
  sources: string[]         // which sources were polled
  error: text | null
}
```

---

## Source Integrations

### Reddit (RSS — no API key required)

- URL pattern: `https://www.reddit.com/r/{subreddit}/top.rss?t=day&limit=25`
- Parse RSS XML, extract post title + URL + score
- AI filter: score posts by relevance to configured topics
- Skip posts with score < configurable threshold (default: 50 upvotes)
- Only ingest the linked URL (not the Reddit thread itself) unless it's a text post

### Hacker News (Algolia API — no key required)

- URL: `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=30`
- Filter by points >= configurable threshold (default: 100)
- Already returns title + URL
- AI filter for relevance before ingesting

### YouTube (Channel RSS — no key required)

- URL pattern: `https://www.youtube.com/feeds/videos.xml?channel_id={channelId}`
- Each channel configured by channel ID (not name — stable identifier)
- Parse Atom feed, extract video title + URL + published date
- Only ingest videos published in the last 24 hours
- AI filter for relevance

### Twitter/X (API v2 — Bearer Token + OAuth 2.0 required)

- Endpoint: `GET /2/users/:id/timelines/reverse_chronological` (home timeline)
- Requires: `TWITTER_BEARER_TOKEN`, `TWITTER_USER_ACCESS_TOKEN` in `.env`
- Fetch last 50 tweets since last run
- Filter: retweets excluded, only original tweets + quotes
- AI filter: score by relevance to configured topics
- For tweets with links, ingest the linked URL; for thread/text tweets, ingest the tweet URL directly
- **Optional at runtime:** if tokens not set, source is skipped with a log message

### AI Relevance Filter (all sources)

Before ingesting, each candidate item is scored by a fast/cheap model (Claude Haiku):

```
Given these research topics: [user topics]
Rate this content's relevance on a scale of 0-10: [title + description]
Return JSON: { score: number, reason: string }
```

Items with score >= 6 are ingested. This prevents noise and keeps the knowledge base signal-rich.

---

## Settings UI

Add a "Research Agent" section to `/settings`:

- **Topics:** free-text tags (e.g. "AI", "LLMs", "TypeScript", "market news") — used by the AI filter
- **Sources list:** table of configured sources with enable/disable toggle
  - Add Reddit: enter subreddit name (e.g. `MachineLearning`, `LocalLLaMA`)
  - Add YouTube: enter channel URL or ID
  - HN: always on (no config needed)
  - Twitter: shows "Connect" button — links to setup instructions
- **Schedule:** time of day to run (default: 6am)
- **Run now:** manual trigger button

---

## Weekly Recap Page (`/recap`)

A new page that presents an AI-generated synthesis of the past 7 days' saved content.

### Sections

1. **Summary** — 3-4 sentence AI-generated overview of what themes dominated this week
2. **By the numbers** — items saved, top categories, source breakdown
3. **Top picks** — 5 highest-signal items (scored by AI during ingestion or re-scored on recap generation)
4. **Emerging themes** — AI-identified clusters of related items saved this week (e.g. "5 items about Claude 4 capabilities", "3 items about Rust tooling")
5. **From the research agent** — items auto-ingested vs manually saved breakdown
6. **Worth revisiting** — 2-3 older items semantically related to this week's themes (surfaces forgotten gems)

### Implementation

- Route: `app/src/app/(dashboard)/recap/page.tsx`
- On page load, check if a recap for the current week exists in a `weekly_recaps` table
- If not, generate one (OpenRouter call synthesizing the week's items) and cache it
- Regeneration button to refresh
- Add "Recap" to primary nav

### `weekly_recaps` table

```ts
weekly_recaps {
  id: uuid
  weekStarting: date         // Monday of the week
  summary: text
  topPickIds: string[]       // item IDs
  themes: jsonb              // [{ label, itemIds, description }]
  generatedAt: timestamp
}
```

---

## BullMQ Job Integration

In `worker.ts`, add:

```ts
// Daily research agent job
const researchScheduler = new QueueScheduler('research-agent', { connection })
const researchQueue = new Queue('research-agent', { connection })

// Schedule at 6am daily (configurable)
await researchQueue.add('daily-run', {}, {
  repeat: { cron: '0 6 * * *' },
  jobId: 'research-agent-daily',
})
```

Worker processes the job by calling the research agent module.

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `app/src/lib/db/schema/research-sources.ts` | New table |
| `app/src/lib/db/schema/research-runs.ts` | New table |
| `app/src/lib/db/schema/weekly-recaps.ts` | New table |
| `app/src/lib/research/sources/reddit.ts` | Reddit RSS fetcher |
| `app/src/lib/research/sources/hackernews.ts` | HN Algolia fetcher |
| `app/src/lib/research/sources/youtube.ts` | YouTube RSS fetcher |
| `app/src/lib/research/sources/twitter.ts` | Twitter API v2 fetcher |
| `app/src/lib/research/relevance-filter.ts` | AI scoring with Haiku |
| `app/src/lib/research/agent.ts` | Orchestrates all sources |
| `app/src/lib/research/recap.ts` | Weekly recap generation |
| `app/src/app/(dashboard)/recap/page.tsx` | Recap UI |
| `app/src/app/api/research/run/route.ts` | Manual trigger API |
| `app/src/app/(dashboard)/settings/page.tsx` | Add research config section |
| `app/worker.ts` | Add research agent scheduled job |
| `app/drizzle/` | New migration for 3 new tables |

---

## Environment Variables Added

```
TWITTER_BEARER_TOKEN       Twitter API v2 Bearer Token (optional)
TWITTER_USER_ACCESS_TOKEN  OAuth 2.0 user access token (optional)
TWITTER_USER_ID            Your Twitter user ID (optional)
```

---

## Out of Scope (v1)

- Email digests (follow-on after recap page ships)
- Per-source frequency (all sources run on same daily schedule)
- Source health monitoring / alerting
- Twitter OAuth flow in-app (user sets up tokens manually via developer.twitter.com)
