import { describe, expect, it } from 'vitest'
import { initialState, reduce, type SavedState } from './state'

const D1 = '2026-10-08'
const D2 = '2026-10-09'
const D3 = '2026-10-10'

describe('initialState', () => {
  it('starts empty with default settings', () => {
    expect(initialState()).toEqual({
      version: 1,
      completed: {},
      unlockAll: false,
      runs: {},
      settings: { language: 'js', speed: 1 },
      streak: { current: 0, longest: 0, lastStudyDay: null, freezeUsedWeek: null },
      badges: {},
    })
  })

  it('returns a fresh object each time', () => {
    expect(initialState()).not.toBe(initialState())
  })
})

describe('reduce: studying', () => {
  it('a finished run records the topic, starts the streak and earns First Run once', () => {
    const first = reduce(initialState(), { type: 'runFinished', topicId: 'sum-demo' }, D1)
    expect(first.state.runs).toEqual({ 'sum-demo': true })
    expect(first.state.streak.current).toBe(1)
    expect(first.state.badges).toEqual({ 'first-run': D1 })
    expect(first.newBadges).toEqual(['first-run'])

    const again = reduce(first.state, { type: 'runFinished', topicId: 'sum-demo' }, D1)
    expect(again.newBadges).toEqual([])
    expect(again.state.streak.current).toBe(1)
  })

  it('a checked quiz completes the topic with stars, counts as a study day and earns badges', () => {
    const { state, newBadges } = reduce(initialState(), { type: 'quizChecked', topicId: 'sum-demo', correct: 3, total: 3 }, D1)
    expect(state.completed).toEqual({ 'sum-demo': { stars: 3 } })
    expect(state.streak.current).toBe(1)
    expect(newBadges).toEqual(['first-quiz', 'perfect-score'])
  })

  it('keeps the best stars when a quiz is retried', () => {
    const best = reduce(initialState(), { type: 'quizChecked', topicId: 'a', correct: 3, total: 3 }, D1).state
    const retry = reduce(best, { type: 'quizChecked', topicId: 'a', correct: 0, total: 3 }, D1).state
    expect(retry.completed.a.stars).toBe(3)
  })

  it('earns the streak badge on the third day', () => {
    let s = reduce(initialState(), { type: 'runFinished', topicId: 'a' }, D1).state
    s = reduce(s, { type: 'runFinished', topicId: 'a' }, D2).state
    const third = reduce(s, { type: 'runFinished', topicId: 'a' }, D3)
    expect(third.newBadges).toEqual(['streak-3'])
    expect(third.state.badges['streak-3']).toBe(D3)
  })

  it('does not change the state it was given', () => {
    const before = initialState()
    const snapshot = JSON.stringify(before)
    reduce(before, { type: 'runFinished', topicId: 'a' }, D1)
    expect(JSON.stringify(before)).toBe(snapshot)
  })
})

describe('reduce: settings', () => {
  const start = initialState()

  it('sets unlock all and the language', () => {
    expect(reduce(start, { type: 'setUnlockAll', value: true }, D1).state.unlockAll).toBe(true)
    expect(reduce(start, { type: 'setLanguage', language: 'ts' }, D1).state.settings.language).toBe('ts')
  })

  it('keeps speed within 0.5x to 4x, in steps of 0.5', () => {
    const speed = (value: number) => reduce(start, { type: 'setSpeed', speed: value }, D1).state.settings.speed
    expect(speed(2)).toBe(2)
    expect(speed(9)).toBe(4)
    expect(speed(0.1)).toBe(0.5)
    expect(speed(1.26)).toBe(1.5)
    expect(speed(Number.NaN)).toBe(1)
  })

  it('changing settings does not count as studying', () => {
    expect(reduce(start, { type: 'setSpeed', speed: 2 }, D1).state.streak.current).toBe(0)
  })
})

describe('reduce: reset', () => {
  it('clears progress, streak and badges but keeps settings and unlock all', () => {
    let s: SavedState = initialState()
    s = reduce(s, { type: 'setLanguage', language: 'ts' }, D1).state
    s = reduce(s, { type: 'setSpeed', speed: 3 }, D1).state
    s = reduce(s, { type: 'setUnlockAll', value: true }, D1).state
    s = reduce(s, { type: 'quizChecked', topicId: 'a', correct: 3, total: 3 }, D1).state
    s = reduce(s, { type: 'runFinished', topicId: 'a' }, D1).state

    const { state, newBadges } = reduce(s, { type: 'reset' }, D2)
    expect(state.completed).toEqual({})
    expect(state.runs).toEqual({})
    expect(state.badges).toEqual({})
    expect(state.streak).toEqual(initialState().streak)
    expect(state.settings).toEqual({ language: 'ts', speed: 3 })
    expect(state.unlockAll).toBe(true)
    expect(newBadges).toEqual([])
  })
})

describe('reduce: replace', () => {
  it('swaps in a restored state without earning or announcing anything', () => {
    const restored: SavedState = {
      ...initialState(),
      completed: { a: { stars: 2 } },
      settings: { language: 'ts', speed: 2 },
      badges: { 'first-run': '2026-10-01' },
    }
    const current = reduce(initialState(), { type: 'quizChecked', topicId: 'b', correct: 3, total: 3 }, D1).state
    const result = reduce(current, { type: 'replace', state: restored }, D2)
    expect(result.state).toBe(restored)
    expect(result.newBadges).toEqual([])
  })
})
