import { describe, it, expect } from 'vitest'

describe('proxy', () => {
  it('exports a function as the default export', async () => {
    const mod = await import('@/proxy')
    expect(typeof mod.proxy).toBe('function')
  })

  it('exports a config object with a non-empty matcher array', async () => {
    const { config } = await import('@/proxy')
    expect(config).toHaveProperty('matcher')
    expect(Array.isArray(config.matcher)).toBe(true)
    expect(config.matcher.length).toBeGreaterThan(0)
    expect(config.matcher.every((m: string) => m.length > 0)).toBe(true)
  })
})
