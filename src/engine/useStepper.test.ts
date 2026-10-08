import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStepper } from './useStepper'

/** One timer tick per act(), like a real clock: React re-arms the timer between ticks. */
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useStepper manual stepping', () => {
  it('starts on the first frame, paused, at 1x', () => {
    const { result } = renderHook(() => useStepper(5))
    expect(result.current).toMatchObject({ index: 0, isPlaying: false, speed: 1, isFirst: true, isLast: false })
  })

  it('goes next and back, clamping at both ends', () => {
    const { result } = renderHook(() => useStepper(3))
    act(() => result.current.back())
    expect(result.current.index).toBe(0)
    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
    expect(result.current.isLast).toBe(true)
    act(() => result.current.back())
    expect(result.current.index).toBe(1)
  })

  it('restart returns to the first frame and pauses', () => {
    const { result } = renderHook(() => useStepper(4))
    act(() => result.current.next())
    act(() => result.current.togglePlay())
    act(() => result.current.restart())
    expect(result.current).toMatchObject({ index: 0, isPlaying: false })
  })

  it('treats a single frame as both first and last', () => {
    const { result } = renderHook(() => useStepper(1))
    expect(result.current).toMatchObject({ isFirst: true, isLast: true })
  })
})

describe('useStepper autoplay', () => {
  it('advances one frame every 1200 ms at 1x', () => {
    const { result } = renderHook(() => useStepper(5))
    act(() => result.current.togglePlay())
    expect(result.current.isPlaying).toBe(true)
    tick(1199)
    expect(result.current.index).toBe(0)
    tick(1)
    expect(result.current.index).toBe(1)
    tick(1200)
    tick(1200)
    expect(result.current.index).toBe(3)
  })

  it('uses a shorter delay at higher speed', () => {
    const { result } = renderHook(() => useStepper(5))
    act(() => result.current.setSpeed(4))
    act(() => result.current.togglePlay())
    tick(300)
    expect(result.current.index).toBe(1)
  })

  it('applies a speed change made while playing', () => {
    const { result } = renderHook(() => useStepper(10))
    act(() => result.current.togglePlay())
    act(() => result.current.setSpeed(2))
    tick(600)
    expect(result.current.index).toBe(1)
  })

  it('stops by itself on the last frame', () => {
    const { result } = renderHook(() => useStepper(3))
    act(() => result.current.togglePlay())
    tick(1200)
    tick(1200)
    tick(1200)
    expect(result.current).toMatchObject({ index: 2, isPlaying: false, isLast: true })
  })

  it('pauses when toggled again', () => {
    const { result } = renderHook(() => useStepper(5))
    act(() => result.current.togglePlay())
    act(() => result.current.togglePlay())
    tick(5000)
    expect(result.current).toMatchObject({ index: 0, isPlaying: false })
  })

  it('starts over when Play is pressed on the last frame', () => {
    const { result } = renderHook(() => useStepper(3))
    act(() => result.current.togglePlay())
    tick(1200)
    tick(1200)
    expect(result.current.index).toBe(2)
    act(() => result.current.togglePlay())
    expect(result.current).toMatchObject({ index: 0, isPlaying: true })
  })

  it('pauses when the learner steps manually', () => {
    const { result } = renderHook(() => useStepper(5))
    act(() => result.current.togglePlay())
    act(() => result.current.next())
    expect(result.current).toMatchObject({ index: 1, isPlaying: false })
  })
})
