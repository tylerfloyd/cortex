import { describe, it, expect, vi } from 'vitest'

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
