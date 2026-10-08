import { describe, expect, it } from 'vitest'
import { stages } from '../topics/stages'
import { BADGES, evaluateBadges } from './badges'
import { initialState, type SavedState } from './state'

const state = (overrides: Partial<SavedState> = {}): SavedState => ({ ...initialState(), ...overrides })
const earnedBy = (s: SavedState) => BADGES.filter((b) => b.earned(s)).map((b) => b.id)
const completedAll = Object.fromEntries(stages.map((s) => [s.id, { stars: 1 as const }]))

describe('BADGES', () => {
  it('has nine badges with unique ids and the text the badges page shows', () => {
    expect(BADGES).toHaveLength(9)
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(9)
    for (const b of BADGES) {
      expect(b.title.length).toBeGreaterThan(0)
      expect(b.description.length).toBeGreaterThan(0)
      expect(b.hint.length).toBeGreaterThan(0)
    }
  })

  it('ties topic badges to their topic, so the page can say when it is not built yet', () => {
    const tied = BADGES.filter((b) => b.topicId).map((b) => [b.id, b.topicId])
    expect(tied).toEqual([
      ['hidden-loop-spotter', 'hidden-loops'],
      ['set-master', 'has-duplicate'],
      ['pointer-pro', 'two-pointers'],
    ])
    for (const [, topicId] of tied) expect(stages.some((s) => s.id === topicId)).toBe(true)
  })

  it('earns nothing on a fresh start', () => {
    expect(earnedBy(state())).toEqual([])
  })

  it('First Run: any run played to the last step', () => {
    expect(earnedBy(state({ runs: { 'sum-demo': true } }))).toEqual(['first-run'])
  })

  it('First Quiz: any topic completed by checking a quiz', () => {
    expect(earnedBy(state({ completed: { 'sum-demo': { stars: 1 } } }))).toEqual(['first-quiz'])
  })

  it('Perfect Score: 3 stars on any topic', () => {
    expect(earnedBy(state({ completed: { 'sum-demo': { stars: 2 } } }))).not.toContain('perfect-score')
    expect(earnedBy(state({ completed: { 'sum-demo': { stars: 3 } } }))).toContain('perfect-score')
  })

  it('streak badges use the longest streak, so they are never lost', () => {
    const streak = (longest: number) => ({ current: 0, longest, lastStudyDay: '2026-10-08', freezeUsedWeek: null })
    expect(earnedBy(state({ streak: streak(2) }))).toEqual([])
    expect(earnedBy(state({ streak: streak(3) }))).toEqual(['streak-3'])
    expect(earnedBy(state({ streak: streak(7) }))).toEqual(['streak-3', 'streak-7'])
  })

  it.each([
    ['hidden-loops', 'hidden-loop-spotter'],
    ['has-duplicate', 'set-master'],
    ['two-pointers', 'pointer-pro'],
  ])('completing %s earns %s', (topic, badge) => {
    expect(earnedBy(state({ completed: { [topic]: { stars: 1 } } }))).toContain(badge)
  })

  it('Path Complete needs every stage completed', () => {
    const { 'binary-search': _skipped, ...almost } = completedAll
    void _skipped
    expect(earnedBy(state({ completed: almost }))).not.toContain('path-complete')
    expect(earnedBy(state({ completed: completedAll }))).toContain('path-complete')
  })
})

describe('evaluateBadges', () => {
  it('returns badges that are earned but not recorded yet, in badge order', () => {
    const s = state({ runs: { a: true }, completed: { a: { stars: 3 } } })
    expect(evaluateBadges(s)).toEqual(['first-run', 'first-quiz', 'perfect-score'])
  })

  it('skips badges already recorded, and never un-earns one', () => {
    const s = state({ runs: { a: true }, badges: { 'first-run': '2026-10-01' } })
    expect(evaluateBadges(s)).toEqual([])
    const lostCondition = state({ badges: { 'first-run': '2026-10-01' } })
    expect(evaluateBadges(lostCondition)).toEqual([])
  })
})
