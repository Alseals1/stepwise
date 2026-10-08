import { initialState, normalizeSpeed, type SavedState } from '../progress/state'
import { EMPTY_STREAK, type StreakState } from '../progress/streak'

/** The only module that touches localStorage. Swap it to move saving elsewhere (v2: accounts). */
export const STORAGE_KEY = 'stepwise:v1'

const DAY = /^\d{4}-\d{2}-\d{2}$/

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0

function parseStreak(value: unknown): StreakState {
  if (!isObject(value)) return { ...EMPTY_STREAK }
  const { current, longest, lastStudyDay, freezeUsedWeek } = value
  const validDay = (v: unknown) => v === null || (typeof v === 'string' && DAY.test(v))
  const ok =
    isCount(current) &&
    isCount(longest) &&
    longest >= current &&
    validDay(lastStudyDay) &&
    validDay(freezeUsedWeek) &&
    (lastStudyDay !== null || current === 0)
  return ok
    ? { current, longest, lastStudyDay: lastStudyDay as string | null, freezeUsedWeek: freezeUsedWeek as string | null }
    : { ...EMPTY_STREAK }
}

/** Turns untrusted saved data into a valid state, dropping what is wrong. Null if unusable. */
export function parseSaved(raw: unknown): SavedState | null {
  if (!isObject(raw) || raw.version !== 1 || !isObject(raw.completed)) return null
  const defaults = initialState()

  const completed: SavedState['completed'] = {}
  for (const [id, entry] of Object.entries(raw.completed)) {
    const stars = isObject(entry) ? entry.stars : undefined
    if (stars === 1 || stars === 2 || stars === 3) completed[id] = { stars }
  }

  const runs: SavedState['runs'] = {}
  if (isObject(raw.runs)) for (const [id, v] of Object.entries(raw.runs)) if (v === true) runs[id] = true

  const badges: SavedState['badges'] = {}
  if (isObject(raw.badges)) {
    for (const [id, day] of Object.entries(raw.badges)) if (typeof day === 'string' && DAY.test(day)) badges[id] = day
  }

  const settings = isObject(raw.settings) ? raw.settings : {}
  return {
    version: 1,
    completed,
    unlockAll: raw.unlockAll === true,
    runs,
    settings: {
      language: settings.language === 'ts' ? 'ts' : 'js',
      speed: typeof settings.speed === 'number' ? normalizeSpeed(settings.speed) : defaults.settings.speed,
    },
    streak: parseStreak(raw.streak),
    badges,
    help: { tourSeen: isObject(raw.help) && raw.help.tourSeen === true },
  }
}

export interface Loaded {
  state: SavedState
  /** False when the browser would not even let us read storage. */
  available: boolean
}

export function load(): Loaded {
  let text: string | null
  try {
    text = localStorage.getItem(STORAGE_KEY)
  } catch {
    return { state: initialState(), available: false }
  }
  if (text === null) return { state: initialState(), available: true }
  try {
    return { state: parseSaved(JSON.parse(text)) ?? initialState(), available: true }
  } catch {
    return { state: initialState(), available: true }
  }
}

/** Returns false if the browser refused the write. */
export function save(state: SavedState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
