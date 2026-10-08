import { useCallback, useEffect, useState } from 'react'

export const BASE_DELAY_MS = 1200

export interface Stepper {
  index: number
  isPlaying: boolean
  speed: number
  isFirst: boolean
  isLast: boolean
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
}

export function useStepper(frameCount: number, { initialSpeed = 1, onSpeedChange }: Options = {}): Stepper {
  const last = Math.max(frameCount - 1, 0)
  const [index, setIndex] = useState(0)
  const [wantsPlay, setWantsPlay] = useState(false)
  const [speed, setSpeedState] = useState(initialSpeed)

  const setSpeed = useCallback(
    (next: number) => {
      setSpeedState(next)
      onSpeedChange?.(next)
    },
    [onSpeedChange],
  )

  // Playback ends by itself on the last frame, without needing an effect to flip state.
  const isPlaying = wantsPlay && index < last

  useEffect(() => {
    if (!isPlaying) return
    const id = setTimeout(() => setIndex((i) => Math.min(i + 1, last)), BASE_DELAY_MS / speed)
    return () => clearTimeout(id)
  }, [isPlaying, index, speed, last])

  const next = useCallback(() => {
    setWantsPlay(false)
    setIndex((i) => Math.min(i + 1, last))
  }, [last])

  const back = useCallback(() => {
    setWantsPlay(false)
    setIndex((i) => Math.max(i - 1, 0))
  }, [])

  const restart = useCallback(() => {
    setWantsPlay(false)
    setIndex(0)
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setWantsPlay(false)
      return
    }
    if (index >= last) setIndex(0)
    setWantsPlay(true)
  }, [isPlaying, index, last])

  return {
    index,
    isPlaying,
    speed,
    isFirst: index === 0,
    isLast: index >= last,
    next,
    back,
    restart,
    togglePlay,
    setSpeed,
  }
}
