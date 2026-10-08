import { describe, expect, it } from 'vitest'
import {
  addDays,
  currentStreak,
  dayKey,
  daysBetween,
  EMPTY_STREAK,
  freezeUsedThisWeek,
  recordStudy,
  weekKey,
  type StreakState,
} from './streak'

const study = (days: string[]): StreakState => days.reduce((s, d) => recordStudy(s, d), EMPTY_STREAK)

describe('day helpers', () => {
  it('formats the local calendar day', () => {
    expect(dayKey(new Date(2026, 9, 8, 23, 59))).toBe('2026-10-08')
    expect(dayKey(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01')
  })

  it('counts days between keys, across month, year and leap days', () => {
    expect(daysBetween('2026-10-08', '2026-10-08')).toBe(0)
    expect(daysBetween('2026-10-08', '2026-10-09')).toBe(1)
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2)
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1)
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2)
    expect(daysBetween('2026-10-09', '2026-10-08')).toBe(-1)
  })

  it('is not thrown off by daylight-saving changes', () => {
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2) // US spring forward on the 8th
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2) // US fall back on Nov 1
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2) // EU spring forward on the 29th
  })

  it('adds days', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('starts weeks on Monday', () => {
    expect(weekKey('2026-10-05')).toBe('2026-10-05') // Monday
    expect(weekKey('2026-10-08')).toBe('2026-10-05') // Thursday
    expect(weekKey('2026-10-11')).toBe('2026-10-05') // Sunday
    expect(weekKey('2026-10-12')).toBe('2026-10-12') // next Monday
    expect(weekKey('2027-01-01')).toBe('2026-12-28') // across the year
  })
})

describe('recordStudy', () => {
  it('starts a streak on the first study day', () => {
    expect(study(['2026-10-08'])).toEqual({ current: 1, longest: 1, lastStudyDay: '2026-10-08', freezeUsedWeek: null })
  })

  it('does not count the same day twice', () => {
    expect(study(['2026-10-08', '2026-10-08', '2026-10-08']).current).toBe(1)
  })

  it('adds one for each consecutive day', () => {
    expect(study(['2026-10-08', '2026-10-09', '2026-10-10']).current).toBe(3)
  })

  it('works across a month and year boundary', () => {
    expect(study(['2026-12-30', '2026-12-31', '2027-01-01']).current).toBe(3)
  })

  it('forgives one missed day with the weekly freeze, without counting the missed day', () => {
    const s = study(['2026-10-06', '2026-10-08']) // Tue, then Thu (Wed missed)
    expect(s.current).toBe(2)
    expect(s.freezeUsedWeek).toBe('2026-10-05')
  })

  it('resets when a second day is missed in the same week', () => {
    // Tue, Thu (freeze for Wed), then Sat (Fri missed, freeze already used this week)
    const s = study(['2026-10-06', '2026-10-08', '2026-10-10'])
    expect(s.current).toBe(1)
  })

  it('gives a fresh freeze in a new week', () => {
    // Oct 6 and Oct 8 use the freeze for week Oct 5. Oct 9 -> Oct 12 skips two days, so it resets to 1.
    // Oct 14 misses only Oct 13, and week Oct 12 has its own fresh freeze, so the streak continues.
    const s = study(['2026-10-06', '2026-10-08', '2026-10-09', '2026-10-12', '2026-10-14'])
    expect(s.current).toBe(2)
    expect(s.freezeUsedWeek).toBe('2026-10-12')
  })

  it('judges the freeze by the week of the missed day (Sunday missed, Monday back)', () => {
    // Fri, Sat, then Mon: Sunday was missed. Freeze belongs to the week of Sunday (Oct 5-11).
    const s = study(['2026-10-09', '2026-10-10', '2026-10-12'])
    expect(s.current).toBe(3)
    expect(s.freezeUsedWeek).toBe('2026-10-05')
  })

  it('resets after two or more missed days', () => {
    expect(study(['2026-10-06', '2026-10-07', '2026-10-10']).current).toBe(1)
  })

  it('keeps the longest streak after a reset', () => {
    const s = study(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-09'])
    expect(s.current).toBe(1)
    expect(s.longest).toBe(3)
  })

  it('ignores a date earlier than the last study day (clock set back)', () => {
    const s = study(['2026-10-08', '2026-10-09'])
    expect(recordStudy(s, '2026-10-07')).toEqual(s)
  })
})

describe('currentStreak', () => {
  const s = study(['2026-10-06', '2026-10-07']) // Tue, Wed -> 2

  it('is 0 before any study', () => {
    expect(currentStreak(EMPTY_STREAK, '2026-10-08')).toBe(0)
  })

  it('shows the streak on the study day and the day after (at risk, not lost)', () => {
    expect(currentStreak(s, '2026-10-07')).toBe(2)
    expect(currentStreak(s, '2026-10-08')).toBe(2)
  })

  it('still shows it after one missed day while the weekly freeze is available', () => {
    expect(currentStreak(s, '2026-10-09')).toBe(2)
  })

  it('is broken after one missed day when the freeze is already used that week', () => {
    const used = study(['2026-10-05', '2026-10-07', '2026-10-08']) // freeze used for Tue (week Oct 5)
    expect(used.freezeUsedWeek).toBe('2026-10-05')
    expect(currentStreak(used, '2026-10-10')).toBe(0) // Friday missed, same week
  })

  it('is broken after two or more missed days', () => {
    expect(currentStreak(s, '2026-10-10')).toBe(0)
    expect(currentStreak(s, '2026-11-20')).toBe(0)
  })
})

describe('freezeUsedThisWeek', () => {
  it('is true only for the week the freeze was used', () => {
    const s = study(['2026-10-06', '2026-10-08'])
    expect(freezeUsedThisWeek(s, '2026-10-09')).toBe(true)
    expect(freezeUsedThisWeek(s, '2026-10-12')).toBe(false)
    expect(freezeUsedThisWeek(EMPTY_STREAK, '2026-10-09')).toBe(false)
  })
})
