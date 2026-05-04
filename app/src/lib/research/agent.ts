import { db } from '@/lib/db'
import { researchSources, researchRuns, items } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { fetchRedditPosts } from './sources/reddit'
import { fetchHackerNewsStories } from './sources/hackernews'
import { fetchYouTubeVideos } from './sources/youtube'
import { fetchTwitterTimeline } from './sources/twitter'
import { scoreRelevance, isRelevant } from './relevance-filter'
import { extractionQueue } from '@/lib/queue/queues'

export type ResearchAgentConfig = { dryRun?: boolean }
export type RunSummary = { itemsFound: number; itemsIngested: number; sources: string[] }

type Candidate = { title: string; url: string; description: string | null }

function detectSourceType(url: string): string {
  if (/youtube\.com\/watch|youtu\.be\//.test(url)) return 'youtube'
  if (/twitter\.com\/|x\.com\//.test(url)) return 'twitter'
  if (/reddit\.com\/r\//.test(url)) return 'reddit'
  if (/\.pdf$/i.test(url.split('?')[0])) return 'pdf'
  return 'article'
}

export async function runResearchAgent(config: ResearchAgentConfig = {}): Promise<RunSummary> {
  const { dryRun = false } = config
  const startedAt = new Date()
  let itemsFound = 0
  let itemsIngested = 0
  const usedSources: string[] = []

  try {
    const sources = await db.select().from(researchSources).where(eq(researchSources.enabled, true))

    // HN always runs — no source config needed
    const hnStories = await fetchHackerNewsStories({ minPoints: 100 })
    if (hnStories.length > 0) usedSources.push('hackernews')

    // Per-source fetches
    const redditCandidates: Candidate[] = []
    const ytCandidates: Candidate[] = []

    for (const src of sources) {
      if (src.type === 'reddit') {
        const cfg = src.config as { subreddit?: string }
        if (cfg.subreddit) {
          redditCandidates.push(...await fetchRedditPosts(cfg.subreddit))
        }
      } else if (src.type === 'youtube') {
        const cfg = src.config as { channelId?: string }
        if (cfg.channelId) {
          ytCandidates.push(...await fetchYouTubeVideos(cfg.channelId))
        }
      }
    }

    if (redditCandidates.length > 0) usedSources.push('reddit')
    if (ytCandidates.length > 0) usedSources.push('youtube')

    const tweets = await fetchTwitterTimeline()
    if (tweets.length > 0) usedSources.push('twitter')

    const allCandidates = [...hnStories, ...redditCandidates, ...ytCandidates, ...tweets]
    itemsFound = allCandidates.length

    const allTopics = Array.from(new Set(sources.flatMap(s => s.topics as string[])))
    const topics = allTopics.length > 0 ? allTopics : ['technology', 'AI', 'programming']

    for (const candidate of allCandidates) {
      const relevance = await scoreRelevance(candidate, topics)
      if (!isRelevant(relevance)) continue

      if (!dryRun) {
        try {
          // Insert the item — unique URL constraint handles deduplication
          const [newItem] = await db
            .insert(items)
            .values({
              url: candidate.url,
              sourceType: detectSourceType(candidate.url),
              captureSource: 'research-agent',
              processingStatus: 'pending',
            })
            .returning({ id: items.id })

          await extractionQueue.add('extract', { itemId: newItem.id })
          itemsIngested++
        } catch {
          // URL already exists — skip silently
        }
      } else {
        itemsIngested++
      }
    }

    if (!dryRun) {
      await db.insert(researchRuns).values({
        startedAt,
        completedAt: new Date(),
        itemsFound,
        itemsIngested,
        sources: usedSources,
      })

      for (const src of sources) {
        await db.update(researchSources)
          .set({ lastFetchedAt: new Date() })
          .where(eq(researchSources.id, src.id))
      }
    }
  } catch (err) {
    // Record the failure so it appears in the runs log
    if (!dryRun) {
      await db.insert(researchRuns).values({
        startedAt,
        completedAt: new Date(),
        itemsFound,
        itemsIngested,
        sources: usedSources,
        error: err instanceof Error ? err.message : String(err),
      }).catch(() => { /* best-effort — don't mask original error */ })
    }
    throw err
  }

  return { itemsFound, itemsIngested, sources: usedSources }
}
