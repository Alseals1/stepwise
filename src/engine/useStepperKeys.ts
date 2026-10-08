import { useEffect } from 'react'
import type { Stepper } from './useStepper'

type Handlers = Pick<Stepper, 'next' | 'back' | 'restart' | 'togglePlay'> & {
  /** Picks answer number `index` (counting from 0) while a prediction is being asked. */
  choose?: (index: number) => void
}

const FORM_CONTROLS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/**
 * Space = play/pause, ArrowRight = next, ArrowLeft = back, R = restart, 1 to 4 = pick an answer.
 * Ignored while typing or on a form control (a slider uses the arrows itself).
 * Space is also left alone on a focused button or link, so their own action wins.
 */
export function useStepperKeys({ next, back, restart, togglePlay, choose }: Handlers) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target instanceof HTMLElement ? e.target : null
      if (target && (FORM_CONTROLS.has(target.tagName) || target.isContentEditable)) return

      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') back()
      else if (e.key === 'r' || e.key === 'R') restart()
      else if (choose && /^[1-4]$/.test(e.key)) choose(Number(e.key) - 1)
      else if (e.key === ' ') {
        if (target && (target.tagName === 'BUTTON' || target.tagName === 'A')) return
        togglePlay()
      } else return
      e.preventDefault()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [next, back, restart, togglePlay, choose])
}
