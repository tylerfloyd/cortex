import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/ai/openrouter', () => ({
  chatCompletion: vi.fn().mockResolvedValue(
    JSON.stringify({ score: 8, reason: 'Directly relevant to LLMs' })
  ),
}))

import { scoreRelevance } from '../relevance-filter'

describe('scoreRelevance', () => {
  it('returns score and reason for relevant content', async () => {
    const result = await scoreRelevance(
      { title: 'GPT-5 released', description: 'OpenAI releases new model' },
      ['AI', 'LLMs', 'machine learning']
    )
    expect(result.score).toBe(8)
    expect(result.reason).toBe('Directly relevant to LLMs')
  })

  it('returns score 0 on parse error without throwing', async () => {
    const { chatCompletion } = await import('@/lib/ai/openrouter')
    vi.mocked(chatCompletion).mockResolvedValueOnce('not json')

    const result = await scoreRelevance(
      { title: 'Recipe blog', description: 'How to make pasta' },
      ['AI', 'technology']
    )
    expect(result.score).toBe(0)
  })
})
