import { describe, expect, it } from 'vitest'
import { initialState, type SavedState } from '../progress/state'
import {
  backupFileName,
  buildBackup,
  FAILURE_MESSAGES,
  MAX_BACKUP_CHARS,
  parseBackup,
  serializeBackup,
  summarize,
} from './backup'

const state = (): SavedState => ({
  ...initialState(),
  completed: { 'sum-demo': { stars: 3 }, 'array-basics': { stars: 1 } },
  unlockAll: true,
  runs: { 'sum-demo': true },
  settings: { language: 'ts', speed: 2.5 },
  streak: { current: 3, longest: 5, lastStudyDay: '2026-10-08', freezeUsedWeek: '2026-10-05' },
  badges: { 'first-run': '2026-10-06', 'first-quiz': '2026-10-07' },
})
const NOW = new Date('2026-10-08T14:30:00.000Z')
const text = (backup: object) => JSON.stringify(backup)

describe('buildBackup and serializeBackup', () => {
  it('wraps the saved progress in a labelled envelope', () => {
    expect(buildBackup(state(), NOW)).toEqual({
      app: 'stepwise',
      format: 1,
      exportedAt: '2026-10-08T14:30:00.000Z',
      data: state(),
    })
  })

  it('writes the file pretty-printed and the copied text on one line', () => {
    const backup = buildBackup(state(), NOW)
    expect(serializeBackup(backup, 'file')).toContain('\n  "app": "stepwise"')
    expect(serializeBackup(backup, 'text')).not.toContain('\n')
    expect(JSON.parse(serializeBackup(backup, 'file'))).toEqual(JSON.parse(serializeBackup(backup, 'text')))
  })

  it('names the file after the day', () => {
    expect(backupFileName('2026-10-08')).toBe('stepwise-progress-2026-10-08.json')
  })
})

describe('parseBackup', () => {
  const good = () => text(buildBackup(state(), NOW))

  it('round-trips a backup, keeping badge dates and settings', () => {
    const result = parseBackup(good())
    expect(result).toEqual({ ok: true, state: state(), exportedAt: '2026-10-08T14:30:00.000Z' })
  })

  it('round-trips the pretty-printed file text too', () => {
    expect(parseBackup(serializeBackup(buildBackup(state(), NOW), 'file'))).toMatchObject({ ok: true })
  })

  it('ignores surrounding whitespace and a leading byte-order mark', () => {
    expect(parseBackup(`\uFEFF  \n${good()}\n  `)).toMatchObject({ ok: true })
  })

  it.each([
    ['', 'empty'],
    ['   \n ', 'empty'],
    ['{oops', 'not-json'],
    ['just words', 'not-json'],
    ['[1,2,3]', 'not-stepwise'],
    ['42', 'not-stepwise'],
    ['null', 'not-stepwise'],
    [text({ app: 'other', format: 1, data: {} }), 'not-stepwise'],
    [text({ format: 1, data: {} }), 'not-stepwise'],
    [text({ app: 'stepwise', format: 'one', data: {} }), 'not-stepwise'],
    [text({ app: 'stepwise', format: 0, data: {} }), 'not-stepwise'],
    [text({ app: 'stepwise', format: 2, data: {} }), 'newer-version'],
    [text({ app: 'stepwise', format: 1, data: { ...state(), version: 2 } }), 'newer-version'],
    [text({ app: 'stepwise', format: 1 }), 'invalid-data'],
    [text({ app: 'stepwise', format: 1, data: 'x' }), 'invalid-data'],
    [text({ app: 'stepwise', format: 1, data: { version: 1, completed: 'no' } }), 'invalid-data'],
  ])('rejects %j as %s', (input, reason) => {
    expect(parseBackup(input)).toEqual({ ok: false, reason })
  })

  it('rejects text over the size limit before parsing it', () => {
    expect(parseBackup('x'.repeat(MAX_BACKUP_CHARS + 1))).toEqual({ ok: false, reason: 'too-large' })
  })

  it('cleans bad entries inside the data instead of trusting them', () => {
    const messy = {
      app: 'stepwise',
      format: 1,
      exportedAt: NOW.toISOString(),
      data: { ...state(), completed: { good: { stars: 2 }, bad: { stars: 99 } }, settings: { language: 'cobol', speed: 99 } },
    }
    const result = parseBackup(text(messy))
    expect(result).toMatchObject({ ok: true })
    if (result.ok) {
      expect(result.state.completed).toEqual({ good: { stars: 2 } })
      expect(result.state.settings).toEqual({ language: 'js', speed: 4 })
    }
  })

  it('does not trust a bad exportedAt', () => {
    const result = parseBackup(text({ ...buildBackup(state(), NOW), exportedAt: 'whenever' }))
    expect(result).toMatchObject({ ok: true, exportedAt: '' })
    expect(parseBackup(text({ ...buildBackup(state(), NOW), exportedAt: 42 }))).toMatchObject({ ok: true, exportedAt: '' })
  })

  it('has a plain-words message for every failure', () => {
    for (const reason of ['empty', 'too-large', 'not-json', 'not-stepwise', 'newer-version', 'invalid-data'] as const) {
      expect(FAILURE_MESSAGES[reason].length).toBeGreaterThan(10)
    }
    expect(FAILURE_MESSAGES['newer-version']).toMatch(/update/i)
  })
})

describe('summarize', () => {
  it('counts completed topics, the best streak and badges', () => {
    expect(summarize(state())).toEqual({ topics: 2, bestStreak: 5, badges: 2 })
    expect(summarize(initialState())).toEqual({ topics: 0, bestStreak: 0, badges: 0 })
  })
})
