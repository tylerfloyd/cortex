import { chatCompletion, getModel } from '@/lib/ai/openrouter'

type Candidate = { title: string; description?: string | null }
type ScoreResult = { score: number; reason: string }

export async function scoreRelevance(
  candidate: Candidate,
  topics: string[]
): Promise<ScoreResult> {
  const topicList = topics.join(', ')
  const content = [candidate.title, candidate.description].filter(Boolean).join(' — ')

  const prompt = `You are a research relevance judge. Rate how relevant the following content is to these topics: ${topicList}

Content: "${content}"

Respond with JSON only: { "score": <0-10>, "reason": "<one sentence>" }
A score of 0 means completely irrelevant. A score of 10 means directly on-topic.`

  try {
    const model = await getModel('categorize')
    const raw = await chatCompletion(
      model,
      [{ role: 'user', content: prompt }],
      { jsonMode: true }
    )
    const parsed = JSON.parse(raw) as { score: number; reason: string }
    const score = Math.min(10, Math.max(0, parsed.score ?? 0))
    return { score, reason: parsed.reason ?? '' }
  } catch {
    return { score: 0, reason: 'parse error' }
  }
}

export function isRelevant(result: ScoreResult, threshold = 6): boolean {
  return result.score >= threshold
}
