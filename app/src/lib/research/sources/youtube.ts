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
        const linkRaw = entry['link']
        const linkHref =
          (linkRaw as Record<string, unknown> | undefined)?.['@_href'] as string | undefined
        if (!linkHref) return null
        return {
          title: (entry['title'] as string) ?? '',
          url: linkHref,
          description: null,
        }
      })
      .filter((v): v is YtVideo => v !== null && Boolean(v.title) && Boolean(v.url))
  } catch {
    return []
  }
}
