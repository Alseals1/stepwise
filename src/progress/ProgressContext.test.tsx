import { act, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { ProgressProvider, useProgress } from './ProgressContext'

const wrapper = ({ children }: { children: ReactNode }) => <ProgressProvider>{children}</ProgressProvider>

describe('ProgressContext', () => {
  it('starts empty and locked', () => {
    const { result } = renderHook(() => useProgress(), { wrapper })
    expect(result.current.progress).toEqual({ completed: {}, unlockAll: false })
  })

  it('records a finished quiz with stars, keeping the best', () => {
    const { result } = renderHook(() => useProgress(), { wrapper })
    act(() => result.current.completeTopic('a', 3, 3))
    act(() => result.current.completeTopic('a', 0, 3))
    expect(result.current.progress.completed).toEqual({ a: { stars: 3 } })
  })

  it('toggles unlock all', () => {
    const { result } = renderHook(() => useProgress(), { wrapper })
    act(() => result.current.setUnlockAll(true))
    expect(result.current.progress.unlockAll).toBe(true)
  })

  it('accepts a starting state, for tests and for saved progress later', () => {
    function Probe() {
      return <p>{useProgress().progress.completed.a?.stars} stars</p>
    }
    render(
      <ProgressProvider initial={{ completed: { a: { stars: 2 } }, unlockAll: false }}>
        <Probe />
      </ProgressProvider>,
    )
    expect(screen.getByText('2 stars')).toBeInTheDocument()
  })

  it('complains if used outside the provider', () => {
    expect(() => renderHook(() => useProgress())).toThrow(/ProgressProvider/)
  })
})
