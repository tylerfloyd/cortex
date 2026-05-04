type HnStory = { title: string; url: string; description: string | null }

export async function fetchHackerNewsStories(
  opts: { minPoints?: number; limit?: number } = {}
): Promise<HnStory[]> {
  const { minPoints = 100, limit = 30 } = opts
  const url = `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=${limit}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json() as {
      hits: Array<{ objectID: string; title: string; url: string | null; points: number }>
    }
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
