import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../sources/reddit', () => ({
  fetchRedditPosts: vi.fn().mockResolvedValue([
    { title: 'AI paper', url: 'https://example.com/paper', description: 'Great AI content' }
  ]),
}))
vi.mock('../sources/hackernews', () => ({
  fetchHackerNewsStories: vi.fn().mockResolvedValue([]),
}))
vi.mock('../sources/youtube', () => ({
  fetchYouTubeVideos: vi.fn().mockResolvedValue([]),
}))
vi.mock('../sources/twitter', () => ({
  fetchTwitterTimeline: vi.fn().mockResolvedValue([]),
}))
vi.mock('../relevance-filter', () => ({
  scoreRelevance: vi.fn().mockResolvedValue({ score: 8, reason: 'relevant' }),
  isRelevant: vi.fn().mockReturnValue(true),
}))
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}))
vi.mock('@/lib/queue/queues', () => ({
  extractionQueue: { add: vi.fn().mockResolvedValue(undefined) },
}))

import { runResearchAgent, type ResearchAgentConfig } from '../agent'

describe('runResearchAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns run summary with items found and ingested counts', async () => {
    const { db } = await import('@/lib/db')

    // select().from().where() chain for sources
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
        }]),
      }),
    } as never)

    // insert().values().returning() for item creation
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'item-1' }]),
        onConflictDoNothing: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as never)

    // update().set().where() for lastFetchedAt
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    } as never)

    const config: ResearchAgentConfig = { dryRun: false }
    const result = await runResearchAgent(config)

    expect(result.itemsFound).toBeGreaterThanOrEqual(1)
    expect(result.sources).toContain('reddit')
  })

  it('skips ingestion in dryRun mode', async () => {
    const { db } = await import('@/lib/db')
    const { extractionQueue } = await import('@/lib/queue/queues')

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as never)

    await runResearchAgent({ dryRun: true })
    expect(vi.mocked(extractionQueue.add)).not.toHaveBeenCalled()
  })
})
