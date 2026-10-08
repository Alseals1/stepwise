import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Language } from '../engine/types'
import { load as defaultLoad, save as defaultSave, type Loaded } from '../storage/storage'
import { reduce, type ProgressEvent, type SavedState } from './state'
import { currentStreak, dayKey, freezeUsedThisWeek, type DayKey } from './streak'

export interface Toast {
  key: number
  badgeId: string
}

interface ProgressApi {
  progress: SavedState
  today: DayKey
  /** The streak to show (0 once it can no longer be saved). */
  streak: number
  longestStreak: number
  freezeUsed: boolean
  /** False when the browser can't store data, so progress lasts only for this visit. */
  canSave: boolean
  toasts: Toast[]
  completeTopic: (id: string, correct: number, total: number) => void
  recordRun: (topicId: string) => void
  setUnlockAll: (unlockAll: boolean) => void
  setLanguage: (language: Language) => void
  setSpeed: (speed: number) => void
  resetProgress: () => void
  /** Swaps in a restored backup (already validated). */
  replaceProgress: (state: SavedState) => void
  dismissToast: (key: number) => void
}

export interface StorageApi {
  load: () => Loaded
  save: (state: SavedState) => boolean
}

const ProgressContext = createContext<ProgressApi | null>(null)

const browserStorage: StorageApi = { load: defaultLoad, save: defaultSave }
const systemClock = () => new Date()

interface Props {
  children: ReactNode
  /** Where progress is kept. Tests pass a fake. */
  storage?: StorageApi
  /** The clock. Tests pass a fixed date. */
  now?: () => Date
}

export function ProgressProvider({ children, storage = browserStorage, now = systemClock }: Props) {
  const [loaded] = useState(() => storage.load())
  const [state, setState] = useState(loaded.state)
  const [canSave, setCanSave] = useState(loaded.available)
  const [toasts, setToasts] = useState<Toast[]>([])
  const stateRef = useRef(state)
  const nextToastKey = useRef(1)

  const dispatch = useCallback(
    (event: ProgressEvent) => {
      const result = reduce(stateRef.current, event, dayKey(now()))
      stateRef.current = result.state
      setState(result.state)
      setCanSave(storage.save(result.state))
      if (result.newBadges.length > 0) {
        const added = result.newBadges.map((badgeId) => ({ key: nextToastKey.current++, badgeId }))
        setToasts((current) => [...current, ...added])
      }
      if (event.type === 'reset' || event.type === 'replace') setToasts([])
    },
    [storage, now],
  )

  // Actions keep the same identity between renders, so consumers can list them in effect deps.
  const actions = useMemo(
    () => ({
      completeTopic: (topicId: string, correct: number, total: number) =>
        dispatch({ type: 'quizChecked', topicId, correct, total }),
      recordRun: (topicId: string) => dispatch({ type: 'runFinished', topicId }),
      setUnlockAll: (value: boolean) => dispatch({ type: 'setUnlockAll', value }),
      setLanguage: (language: Language) => dispatch({ type: 'setLanguage', language }),
      setSpeed: (speed: number) => dispatch({ type: 'setSpeed', speed }),
      resetProgress: () => dispatch({ type: 'reset' }),
      replaceProgress: (restored: SavedState) => dispatch({ type: 'replace', state: restored }),
      dismissToast: (key: number) => setToasts((current) => current.filter((t) => t.key !== key)),
    }),
    [dispatch],
  )

  const api = useMemo<ProgressApi>(() => {
    const today = dayKey(now())
    return {
      progress: state,
      today,
      streak: currentStreak(state.streak, today),
      longestStreak: state.streak.longest,
      freezeUsed: freezeUsedThisWeek(state.streak, today),
      canSave,
      toasts,
      ...actions,
    }
  }, [state, canSave, toasts, actions, now])

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressApi {
  const api = useContext(ProgressContext)
  if (!api) throw new Error('useProgress must be used inside a ProgressProvider')
  return api
}
