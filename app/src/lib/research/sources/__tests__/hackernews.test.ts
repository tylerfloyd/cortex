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

  it('returns empty array on network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'))
    expect(await fetchHackerNewsStories()).toEqual([])
  })
})
