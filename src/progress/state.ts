import type { Language } from '../engine/types'
import { evaluateBadges } from './badges'
import { recordResult, type StarCount } from './progress'
import { EMPTY_STREAK, recordStudy, type DayKey, type StreakState } from './streak'

/** Everything saved in the browser. Bump `version` and migrate when the shape changes. */
export interface SavedState {
  version: 1
  completed: Record<string, { stars: StarCount }>
  unlockAll: boolean
  /** Topics whose animation was played to the last step at least once. */
  runs: Record<string, true>
  settings: { language: Language; speed: number }
  streak: StreakState
  /** Badge id -> the day it was earned. */
  badges: Record<string, DayKey>
}

export const MIN_SPEED = 0.5
export const MAX_SPEED = 4

export const initialState = (): SavedState => ({
  version: 1,
  completed: {},
  unlockAll: false,
  runs: {},
  settings: { language: 'js', speed: 1 },
  streak: { ...EMPTY_STREAK },
  badges: {},
})

export type ProgressEvent =
  | { type: 'runFinished'; topicId: string }
  | { type: 'quizChecked'; topicId: string; correct: number; total: number }
  | { type: 'setUnlockAll'; value: boolean }
  | { type: 'setLanguage'; language: Language }
  | { type: 'setSpeed'; speed: number }
  | { type: 'reset' }

/** Clamp to 0.5x..4x and snap to the slider's 0.5 steps. */
export function normalizeSpeed(speed: number): number {
  if (!Number.isFinite(speed)) return 1
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, Math.round(speed * 2) / 2))
}

function withNewBadges(state: SavedState, today: DayKey): { state: SavedState; newBadges: string[] } {
  const newBadges = evaluateBadges(state)
  if (newBadges.length === 0) return { state, newBadges }
  const badges = { ...state.badges, ...Object.fromEntries(newBadges.map((id) => [id, today])) }
  return { state: { ...state, badges }, newBadges }
}

/** Applies one event. Returns the new state and the badges earned by it. */
export function reduce(
  state: SavedState,
  event: ProgressEvent,
  today: DayKey,
): { state: SavedState; newBadges: string[] } {
  switch (event.type) {
    case 'runFinished':
      return withNewBadges(
        { ...state, runs: { ...state.runs, [event.topicId]: true }, streak: recordStudy(state.streak, today) },
        today,
      )
    case 'quizChecked': {
      const { completed } = recordResult(state, event.topicId, event.correct, event.total)
      return withNewBadges({ ...state, completed, streak: recordStudy(state.streak, today) }, today)
    }
    case 'setUnlockAll':
      return { state: { ...state, unlockAll: event.value }, newBadges: [] }
    case 'setLanguage':
      return { state: { ...state, settings: { ...state.settings, language: event.language } }, newBadges: [] }
    case 'setSpeed':
      return { state: { ...state, settings: { ...state.settings, speed: normalizeSpeed(event.speed) } }, newBadges: [] }
    case 'reset':
      return {
        state: { ...initialState(), settings: state.settings, unlockAll: state.unlockAll },
        newBadges: [],
      }
  }
}
