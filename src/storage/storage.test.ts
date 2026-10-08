import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initialState, type SavedState } from '../progress/state'
import { load, parseSaved, save, STORAGE_KEY } from './storage'

const saved = (): SavedState => ({
  ...initialState(),
  completed: { 'sum-demo': { stars: 3 } },
  unlockAll: true,
  runs: { 'sum-demo': true },
  settings: { language: 'ts', speed: 2.5 },
  streak: { current: 3, longest: 5, lastStudyDay: '2026-10-08', freezeUsedWeek: '2026-10-05' },
  badges: { 'first-run': '2026-10-06' },
})

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('parseSaved', () => {
  it('accepts a valid saved state unchanged', () => {
    expect(parseSaved(saved())).toEqual(saved())
  })

  it.each([null, undefined, 'text', 42, [], { version: 2 }, { version: 1, completed: 'no' }])(
    'rejects %j when nothing usable is there',
    (value) => {
      expect(parseSaved(value)).toBeNull()
    },
  )

  it('rejects an unknown version', () => {
    expect(parseSaved({ ...saved(), version: 2 })).toBeNull()
  })

  it('drops bad entries but keeps the good ones', () => {
    const messy = {
      ...saved(),
      completed: { good: { stars: 2 }, zero: { stars: 0 }, four: { stars: 4 }, text: { stars: 'x' }, nope: 7 },
      runs: { a: true, b: false, c: 'yes' },
      badges: { 'first-run': '2026-10-06', bad: 5, worse: 'not-a-date' },
    }
    const parsed = parseSaved(messy)!
    expect(parsed.completed).toEqual({ good: { stars: 2 } })
    expect(parsed.runs).toEqual({ a: true })
    expect(parsed.badges).toEqual({ 'first-run': '2026-10-06' })
  })

  it('falls back to defaults for bad settings', () => {
    const parsed = parseSaved({ ...saved(), unlockAll: 'yes', settings: { language: 'rust', speed: 'fast' } })!
    expect(parsed.unlockAll).toBe(false)
    expect(parsed.settings).toEqual({ language: 'js', speed: 1 })
  })

  it('clamps and snaps a saved speed', () => {
    expect(parseSaved({ ...saved(), settings: { language: 'js', speed: 99 } })!.settings.speed).toBe(4)
    expect(parseSaved({ ...saved(), settings: { language: 'js', speed: 1.3 } })!.settings.speed).toBe(1.5)
  })

  it('falls back to an empty streak when the streak data is bad', () => {
    const empty = initialState().streak
    expect(parseSaved({ ...saved(), streak: 'x' })!.streak).toEqual(empty)
    expect(parseSaved({ ...saved(), streak: { current: -1, longest: 2, lastStudyDay: '2026-10-08', freezeUsedWeek: null } })!.streak).toEqual(empty)
    expect(parseSaved({ ...saved(), streak: { current: 1, longest: 1, lastStudyDay: 'yesterday', freezeUsedWeek: null } })!.streak).toEqual(empty)
    expect(parseSaved({ ...saved(), streak: { current: 5, longest: 2, lastStudyDay: '2026-10-08', freezeUsedWeek: null } })!.streak).toEqual(empty)
  })
})

describe('load and save', () => {
  it('starts fresh when nothing is saved', () => {
    expect(load()).toEqual({ state: initialState(), available: true })
  })

  it('saves and loads a round trip', () => {
    expect(save(saved())).toBe(true)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(saved())
    expect(load()).toEqual({ state: saved(), available: true })
  })

  it('starts fresh, without crashing, when the saved text is not JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{oops')
    expect(load()).toEqual({ state: initialState(), available: true })
  })

  it('starts fresh when the saved data is from another version', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved(), version: 99 }))
    expect(load().state).toEqual(initialState())
  })

  it('reports storage as unavailable when reading throws, and still returns a usable state', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(load()).toEqual({ state: initialState(), available: false })
  })

  it('returns false from save when writing throws (private mode or full)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    expect(save(saved())).toBe(false)
  })
})
