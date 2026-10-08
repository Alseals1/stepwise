import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { vi } from 'vitest'
import { ProgressProvider } from '../progress/ProgressContext'
import { initialState, type SavedState } from '../progress/state'

interface Options {
  state?: SavedState
  /** False simulates a browser that blocks storage. */
  available?: boolean
  /** False simulates a browser that refuses writes. */
  saveResult?: boolean
  /** The pretend current time. Defaults to Thu 8 Oct 2026, 10:00. */
  now?: Date
}

/** Renders inside a ProgressProvider that uses a fake storage and a fixed clock. */
export function renderWithProgress(ui: ReactElement, { state, available = true, saveResult = true, now }: Options = {}) {
  const storage = {
    load: vi.fn(() => ({ state: state ?? initialState(), available })),
    save: vi.fn(() => saveResult),
  }
  const clock = { date: now ?? new Date(2026, 9, 8, 10, 0) }
  const view = render(
    <ProgressProvider storage={storage} now={() => clock.date}>
      {ui}
    </ProgressProvider>,
  )
  return { ...view, storage, clock }
}
