import { describe, it, expect } from 'vitest'
import { researchSources, researchRuns, weeklyRecaps } from '../schema'

describe('research schema exports', () => {
  it('exports researchSources table', () => {
    expect(researchSources).toBeDefined()
    expect(researchSources.id).toBeDefined()
    expect(researchSources.type).toBeDefined()
    expect(researchSources.config).toBeDefined()
    expect(researchSources.enabled).toBeDefined()
  })

  it('exports researchRuns table', () => {
    expect(researchRuns).toBeDefined()
    expect(researchRuns.itemsFound).toBeDefined()
    expect(researchRuns.itemsIngested).toBeDefined()
  })

  it('exports weeklyRecaps table', () => {
    expect(weeklyRecaps).toBeDefined()
    expect(weeklyRecaps.weekStarting).toBeDefined()
    expect(weeklyRecaps.summary).toBeDefined()
    expect(weeklyRecaps.themes).toBeDefined()
  })
})
