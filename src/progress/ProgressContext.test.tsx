import { act, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { load as realLoad, save as realSave, STORAGE_KEY } from '../storage/storage'
import { ProgressProvider, useProgress } from './ProgressContext'
import { initialState, type SavedState } from './state'

function setup(loaded: { state?: SavedState; available?: boolean } = {}, saveResult = true) {
  const storage = {
    load: vi.fn(() => ({ state: loaded.state ?? initialState(), available: loaded.available ?? true })),
    save: vi.fn(() => saveResult),
  }
  const clock = { date: new Date(2026, 9, 8, 10, 0) }
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ProgressProvider storage={storage} now={() => clock.date}>
      {children}
    </ProgressProvider>
  )
  const hook = renderHook(() => useProgress(), { wrapper })
  return { ...hook, storage, clock }
}

describe('ProgressProvider', () => {
  it('starts from what storage loads', () => {
    const state = { ...initialState(), completed: { a: { stars: 2 as const } } }
    const { result } = setup({ state })
    expect(result.current.progress.completed).toEqual({ a: { stars: 2 } })
  })

  it('checking a quiz completes the topic, starts the streak, saves, and queues badge toasts', () => {
    const { result, storage } = setup()
    act(() => result.current.completeTopic('a', 3, 3))
    expect(result.current.progress.completed).toEqual({ a: { stars: 3 } })
    expect(result.current.streak).toBe(1)
    expect(storage.save).toHaveBeenLastCalledWith(result.current.progress)
    expect(result.current.toasts.map((t) => t.badgeId)).toEqual(['first-quiz', 'perfect-score'])
  })

  it('a finished run earns First Run once, however often it is repeated', () => {
    const { result } = setup()
    act(() => result.current.recordRun('a'))
    act(() => result.current.recordRun('a'))
    expect(result.current.progress.runs).toEqual({ a: true })
    expect(result.current.toasts.map((t) => t.badgeId)).toEqual(['first-run'])
  })

  it('dismisses toasts one by one', () => {
    const { result } = setup()
    act(() => result.current.completeTopic('a', 3, 3))
    const [first, second] = result.current.toasts
    act(() => result.current.dismissToast(first.key))
    expect(result.current.toasts).toEqual([second])
  })

  it('gives each toast its own key', () => {
    const { result } = setup()
    act(() => result.current.completeTopic('a', 3, 3))
    act(() => result.current.recordRun('a'))
    const keys = result.current.toasts.map((t) => t.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('saves settings without counting them as studying', () => {
    const { result, storage } = setup()
    act(() => result.current.setLanguage('ts'))
    act(() => result.current.setSpeed(2))
    act(() => result.current.setUnlockAll(true))
    expect(result.current.progress.settings).toEqual({ language: 'ts', speed: 2, predictMode: false })
    expect(result.current.progress.unlockAll).toBe(true)
    expect(result.current.streak).toBe(0)
    expect(storage.save).toHaveBeenCalledTimes(3)
  })

  it('follows the injected clock for the streak, the best streak and the freeze', () => {
    const { result, clock } = setup()
    act(() => result.current.recordRun('a')) // Thu Oct 8
    clock.date = new Date(2026, 9, 9, 10, 0)
    act(() => result.current.recordRun('a'))
    expect(result.current.streak).toBe(2)
    clock.date = new Date(2026, 9, 11, 10, 0) // Sun: Saturday missed, freeze used (week of Oct 5)
    act(() => result.current.recordRun('a'))
    expect(result.current.streak).toBe(3)
    expect(result.current.longestStreak).toBe(3)
    expect(result.current.freezeUsed).toBe(true)
    expect(result.current.today).toBe('2026-10-11')
  })

  it('resets progress but keeps settings', () => {
    const { result } = setup()
    act(() => result.current.setLanguage('ts'))
    act(() => result.current.completeTopic('a', 3, 3))
    act(() => result.current.resetProgress())
    expect(result.current.progress.completed).toEqual({})
    expect(result.current.streak).toBe(0)
    expect(result.current.progress.settings.language).toBe('ts')
    expect(result.current.toasts).toEqual([])
  })

  it('reports it cannot save when storage is unavailable or refuses a write', () => {
    expect(setup({ available: false }).result.current.canSave).toBe(false)
    const refusing = setup({}, false)
    expect(refusing.result.current.canSave).toBe(true)
    act(() => refusing.result.current.setSpeed(2))
    expect(refusing.result.current.canSave).toBe(false)
    expect(refusing.result.current.progress.settings.speed).toBe(2) // still works in memory
  })

  it('works with the real storage and survives a remount', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ProgressProvider storage={{ load: realLoad, save: realSave }}>{children}</ProgressProvider>
    )
    const first = renderHook(() => useProgress(), { wrapper })
    act(() => first.result.current.completeTopic('a', 2, 3))
    first.unmount()
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    const second = renderHook(() => useProgress(), { wrapper })
    expect(second.result.current.progress.completed).toEqual({ a: { stars: 2 } })
  })

  it('complains if used outside the provider', () => {
    function Probe() {
      useProgress()
      return null
    }
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/ProgressProvider/)
    vi.restoreAllMocks()
    expect(screen.queryByText('x')).not.toBeInTheDocument()
  })
})

describe('replaceProgress', () => {
  const restored: SavedState = {
    ...initialState(),
    completed: { a: { stars: 2 } },
    settings: { language: 'ts', speed: 2, predictMode: false },
  }

  it('replaces everything, saves it, and queues no toasts', () => {
    const { result, storage } = setup()
    act(() => result.current.completeTopic('b', 3, 3)) // earns badges, so there are toasts to clear
    expect(result.current.toasts.length).toBeGreaterThan(0)
    act(() => result.current.replaceProgress(restored))
    expect(result.current.progress).toEqual(restored)
    expect(storage.save).toHaveBeenLastCalledWith(restored)
    expect(result.current.toasts).toEqual([])
  })

  it('has a stable identity', () => {
    const { result } = setup()
    const before = result.current.replaceProgress
    act(() => result.current.setSpeed(2))
    expect(result.current.replaceProgress).toBe(before)
  })
})

describe('predict mode setting', () => {
  it('starts off, is saved when switched, and does not count as studying', () => {
    const { result, storage } = setup()
    expect(result.current.progress.settings.predictMode).toBe(false)
    act(() => result.current.setPredictMode(true))
    expect(result.current.progress.settings.predictMode).toBe(true)
    expect(result.current.streak).toBe(0)
    expect(storage.save).toHaveBeenLastCalledWith(result.current.progress)
  })

  it('has a stable identity', () => {
    const { result } = setup()
    const before = result.current.setPredictMode
    act(() => result.current.setSpeed(2))
    expect(result.current.setPredictMode).toBe(before)
  })
})

describe('tour', () => {
  it('starts as not seen and not requested', () => {
    const { result } = setup()
    expect(result.current.progress.help.tourSeen).toBe(false)
    expect(result.current.tourRequested).toBe(false)
  })

  it('markTourSeen saves it and does not count as studying', () => {
    const { result, storage } = setup()
    act(() => result.current.markTourSeen())
    expect(result.current.progress.help.tourSeen).toBe(true)
    expect(result.current.streak).toBe(0)
    expect(storage.save).toHaveBeenLastCalledWith(result.current.progress)
  })

  it('requestTour asks for the tour once, and finishing it clears the request', () => {
    const { result } = setup()
    act(() => result.current.requestTour())
    expect(result.current.tourRequested).toBe(true)
    act(() => result.current.markTourSeen())
    expect(result.current.tourRequested).toBe(false)
  })

  it('a request is not saved: it only lasts for this visit', () => {
    const { result, storage } = setup()
    act(() => result.current.requestTour())
    expect(storage.save).not.toHaveBeenCalled()
  })
})

describe('ProgressProvider identity', () => {
  it('keeps the same action functions across renders, so effects that list them do not re-run', () => {
    const { result } = setup()
    const before = { ...result.current }
    act(() => result.current.setSpeed(2))
    const after = result.current
    expect(after.recordRun).toBe(before.recordRun)
    expect(after.setSpeed).toBe(before.setSpeed)
    expect(after.setLanguage).toBe(before.setLanguage)
    expect(after.completeTopic).toBe(before.completeTopic)
    expect(after.markTourSeen).toBe(before.markTourSeen)
    expect(after.requestTour).toBe(before.requestTour)
  })
})
