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
        const titleRaw = i['title']
        const title =
          (titleRaw as { __cdata?: string })?.__cdata ??
          (typeof titleRaw === 'string' ? titleRaw : '') ?? ''
        const link = (i['link'] as string) ?? ''
        const descRaw = i['description']
        const desc =
          (descRaw as { __cdata?: string })?.__cdata ??
          (typeof descRaw === 'string' ? descRaw : null)
        return { title, url: link, description: desc }
      })
      .filter(p => p.title && p.url)
  } catch {
    return []
  }
}
