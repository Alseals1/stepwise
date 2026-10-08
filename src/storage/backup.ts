import type { SavedState } from '../progress/state'
import type { DayKey } from '../progress/streak'
import { parseSaved } from './storage'

export const BACKUP_FORMAT = 1
/** A real backup is a few KB. This only stops absurdly large input. */
export const MAX_BACKUP_CHARS = 1_000_000

export interface Backup {
  app: 'stepwise'
  format: typeof BACKUP_FORMAT
  exportedAt: string
  data: SavedState
}

export function buildBackup(state: SavedState, now: Date): Backup {
  return { app: 'stepwise', format: BACKUP_FORMAT, exportedAt: now.toISOString(), data: state }
}

/** The file is easy to read; the copied text is one line. */
export function serializeBackup(backup: Backup, style: 'file' | 'text'): string {
  return JSON.stringify(backup, null, style === 'file' ? 2 : undefined)
}

export const backupFileName = (day: DayKey) => `stepwise-progress-${day}.json`

export type ParseFailure = 'empty' | 'too-large' | 'not-json' | 'not-stepwise' | 'newer-version' | 'invalid-data'

export type ParseResult =
  | { ok: true; state: SavedState; exportedAt: string }
  | { ok: false; reason: ParseFailure }

export const FAILURE_MESSAGES: Record<ParseFailure, string> = {
  empty: 'Paste a backup or choose a file first.',
  'too-large': 'That is too big to be a Stepwise backup.',
  'not-json': "That isn't a readable backup. Copy all of the text, or choose the file you downloaded.",
  'not-stepwise': "That doesn't look like a Stepwise backup.",
  'newer-version': 'That backup is from a newer version of Stepwise. Update the app, then try again.',
  'invalid-data': 'That backup is damaged or incomplete, so nothing was changed.',
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Checks a backup without changing anything. The inner data goes through the same checks as saved data. */
export function parseBackup(input: string): ParseResult {
  const text = input.replace(/^\uFEFF/, '').trim()
  if (text === '') return { ok: false, reason: 'empty' }
  if (text.length > MAX_BACKUP_CHARS) return { ok: false, reason: 'too-large' }

  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'not-json' }
  }

  if (!isObject(raw) || raw.app !== 'stepwise' || typeof raw.format !== 'number' || raw.format < 1) {
    return { ok: false, reason: 'not-stepwise' }
  }
  if (raw.format > BACKUP_FORMAT) return { ok: false, reason: 'newer-version' }
  if (isObject(raw.data) && typeof raw.data.version === 'number' && raw.data.version > 1) {
    return { ok: false, reason: 'newer-version' }
  }

  const state = parseSaved(raw.data)
  if (!state) return { ok: false, reason: 'invalid-data' }

  const exportedAt =
    typeof raw.exportedAt === 'string' && !Number.isNaN(Date.parse(raw.exportedAt)) ? raw.exportedAt : ''
  return { ok: true, state, exportedAt }
}

export interface Summary {
  topics: number
  bestStreak: number
  badges: number
}

export function summarize(state: SavedState): Summary {
  return {
    topics: Object.keys(state.completed).length,
    bestStreak: state.streak.longest,
    badges: Object.keys(state.badges).length,
  }
}
