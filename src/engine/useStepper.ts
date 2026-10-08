import { useCallback, useEffect, useState } from 'react'

export const BASE_DELAY_MS = 1200

export interface Stepper {
  index: number
  isPlaying: boolean
  speed: number
  isFirst: boolean
  isLast: boolean
  /** A frame waiting behind a question: moving forward stopped before revealing it. */
  pendingIndex: number | null
  /** Reveals the waiting frame (after the question has been answered). */
  release: () => void
  next: () => void
  back: () => void
  restart: () => void
  togglePlay: () => void
  setSpeed: (speed: number) => void
}

interface Options {
  initialSpeed?: number
  /** Called when the learner moves the speed slider, so the choice can be remembered. */
  onSpeedChange?: (speed: number) => void
  /** Return true for a frame that must be asked about before it is shown. */
  gate?: (target: number) => boolean
}

export function useStepper(frameCount: number, { initialSpeed = 1, onSpeedChange, gate }: Options = {}): Stepper {
  const last = Math.max(frameCount - 1, 0)
  const [index, setIndex] = useState(0)
  const [wantsPlay, setWantsPlay] = useState(false)
  const [speed, setSpeedState] = useState(initialSpeed)
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)

  const setSpeed = useCallback(
    (next: number) => {
      setSpeedState(next)
      onSpeedChange?.(next)
    },
    [onSpeedChange],
  )

  // Playback ends by itself on the last frame, without needing an effect to flip state.
  const isPlaying = wantsPlay && index < last && pendingIndex === null

  // Moving forward from `index`: stop at a question instead of revealing its frame.
  const advance = useCallback(() => {
    const target = Math.min(index + 1, last)
    if (target === index) return
    if (gate?.(target)) {
      setPendingIndex(target)
      setWantsPlay(false)
    } else {
      setIndex(target)
    }
  }, [index, last, gate])

  useEffect(() => {
    if (!isPlaying) return
    const id = setTimeout(advance, BASE_DELAY_MS / speed)
    return () => clearTimeout(id)
  }, [isPlaying, advance, speed])

  const next = useCallback(() => {
    if (pendingIndex !== null) return
    setWantsPlay(false)
    advance()
  }, [pendingIndex, advance])

  const back = useCallback(() => {
    setWantsPlay(false)
    setPendingIndex(null)
    setIndex((i) => Math.max(i - 1, 0))
  }, [])

  const restart = useCallback(() => {
    setWantsPlay(false)
    setPendingIndex(null)
    setIndex(0)
  }, [])

  const release = useCallback(() => {
    if (pendingIndex === null) return
    setIndex(pendingIndex)
    setPendingIndex(null)
  }, [pendingIndex])

  const togglePlay = useCallback(() => {
    if (pendingIndex !== null) return
    if (isPlaying) {
      setWantsPlay(false)
      return
    }
    if (index >= last) setIndex(0)
    setWantsPlay(true)
  }, [pendingIndex, isPlaying, index, last])

  return {
    index,
    isPlaying,
    speed,
    isFirst: index === 0,
    isLast: index >= last,
    pendingIndex,
    release,
    next,
    back,
    restart,
    togglePlay,
    setSpeed,
  }
}
