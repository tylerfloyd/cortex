export type Tweet = { title: string; url: string; description: string | null }

export async function fetchTwitterTimeline(): Promise<Tweet[]> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  const accessToken = process.env.TWITTER_USER_ACCESS_TOKEN
  const userId = process.env.TWITTER_USER_ID

  // Optional source — silently skip if not configured
  if (!bearerToken || !accessToken || !userId) return []

  try {
    const res = await fetch(
      `https://api.twitter.com/2/users/${userId}/timelines/reverse_chronological?max_results=50&tweet.fields=text,created_at,entities&expansions=attachments.media_keys&exclude=retweets`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) {
      console.warn('[twitter] API returned', res.status)
      return []
    }
    const data = await res.json() as {
      data?: Array<{
        id: string
        text: string
        entities?: { urls?: Array<{ expanded_url: string }> }
      }>
    }
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
