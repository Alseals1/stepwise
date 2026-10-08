/** A calendar day as "YYYY-MM-DD" in the learner's local time. */
export type DayKey = string

export interface StreakState {
  current: number
  longest: number
  lastStudyDay: DayKey | null
  /** The Monday (day key) of the week whose free freeze has been used. */
  freezeUsedWeek: DayKey | null
}

export const EMPTY_STREAK: StreakState = { current: 0, longest: 0, lastStudyDay: null, freezeUsedWeek: null }

const MS_PER_DAY = 86_400_000

export function dayKey(date: Date): DayKey {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Day math uses UTC parts, so a daylight-saving change can never make a day 23 or 25 hours long.
function toDays(key: DayKey): number {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / MS_PER_DAY
}

function fromDays(days: number): DayKey {
  const d = new Date(days * MS_PER_DAY)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export const daysBetween = (from: DayKey, to: DayKey): number => toDays(to) - toDays(from)
export const addDays = (key: DayKey, n: number): DayKey => fromDays(toDays(key) + n)

/** The Monday of the week containing `key`. */
export function weekKey(key: DayKey): DayKey {
  const days = toDays(key)
  const weekday = new Date(days * MS_PER_DAY).getUTCDay() // 0 = Sunday
  return fromDays(days - ((weekday + 6) % 7))
}

/** Records that the learner studied on `today`. */
export function recordStudy(streak: StreakState, today: DayKey): StreakState {
  const { lastStudyDay } = streak
  if (lastStudyDay === null) return { ...streak, current: 1, longest: Math.max(streak.longest, 1), lastStudyDay: today }

  const gap = daysBetween(lastStudyDay, today)
  if (gap <= 0) return streak // same day, or the clock went backwards

  let current = 1
  let freezeUsedWeek = streak.freezeUsedWeek
  if (gap === 1) {
    current = streak.current + 1
  } else if (gap === 2) {
    const missedWeek = weekKey(addDays(lastStudyDay, 1))
    if (freezeUsedWeek !== missedWeek) {
      current = streak.current + 1
      freezeUsedWeek = missedWeek
    }
  }
  return { current, longest: Math.max(streak.longest, current), lastStudyDay: today, freezeUsedWeek }
}

/** The streak to show: 0 as soon as it can no longer be saved. */
export function currentStreak(streak: StreakState, today: DayKey): number {
  if (streak.lastStudyDay === null) return 0
  const gap = daysBetween(streak.lastStudyDay, today)
  if (gap <= 1) return streak.current
  if (gap === 2 && streak.freezeUsedWeek !== weekKey(addDays(streak.lastStudyDay, 1))) return streak.current
  return 0
}

export function freezeUsedThisWeek(streak: StreakState, today: DayKey): boolean {
  return streak.freezeUsedWeek !== null && streak.freezeUsedWeek === weekKey(today)
}
