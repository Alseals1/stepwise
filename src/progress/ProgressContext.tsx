import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { recordResult, type Progress } from './progress'

interface ProgressApi {
  progress: Progress
  completeTopic: (id: string, correct: number, total: number) => void
  setUnlockAll: (unlockAll: boolean) => void
}

const ProgressContext = createContext<ProgressApi | null>(null)

const EMPTY: Progress = { completed: {}, unlockAll: false }

/** Progress lives in memory for now; feature 0004 saves it in the browser. */
export function ProgressProvider({ children, initial = EMPTY }: { children: ReactNode; initial?: Progress }) {
  const [progress, setProgress] = useState(initial)

  const completeTopic = useCallback((id: string, correct: number, total: number) => {
    setProgress((p) => recordResult(p, id, correct, total))
  }, [])
  const setUnlockAll = useCallback((unlockAll: boolean) => setProgress((p) => ({ ...p, unlockAll })), [])

  const value = useMemo(() => ({ progress, completeTopic, setUnlockAll }), [progress, completeTopic, setUnlockAll])
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressApi {
  const api = useContext(ProgressContext)
  if (!api) throw new Error('useProgress must be used inside a ProgressProvider')
  return api
}
