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

  it('returns empty array on network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'))
    expect(await fetchYouTubeVideos('UCfoo')).toEqual([])
  })
})
