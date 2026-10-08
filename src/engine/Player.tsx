import { useEffect, useRef, useState } from 'react'
import { ArrayBoxes } from '../visuals/ArrayBoxes'
import { CodePanel } from './CodePanel'
import { Controls } from './Controls'
import { Narration } from './Narration'
import type { Frame, Language, TopicCode } from './types'
import { useStepper } from './useStepper'
import { useStepperKeys } from './useStepperKeys'
import { VariablesPanel } from './VariablesPanel'

interface Props {
  frames: Frame[]
  code: TopicCode
  /** Saved settings, used as the starting values. */
  initialLanguage?: Language
  onLanguageChange?: (language: Language) => void
  initialSpeed?: number
  onSpeedChange?: (speed: number) => void
  /** Called each time the last step is reached (not at mount). */
  onRunComplete?: () => void
}

export function Player({
  frames,
  code,
  initialLanguage = 'js',
  onLanguageChange,
  initialSpeed,
  onSpeedChange,
  onRunComplete,
}: Props) {
  const stepper = useStepper(frames.length, { initialSpeed, onSpeedChange })
  const [language, setLanguageState] = useState<Language>(initialLanguage)
  useStepperKeys(stepper)

  function setLanguage(next: Language) {
    setLanguageState(next)
    onLanguageChange?.(next)
  }

  // Fires when the last step is entered, so a one-frame run is silent at mount.
  const wasLast = useRef(stepper.isLast)
  useEffect(() => {
    if (stepper.isLast && !wasLast.current) onRunComplete?.()
    wasLast.current = stepper.isLast
  }, [stepper.isLast, onRunComplete])

  const frame = frames[Math.min(stepper.index, frames.length - 1)]
  if (!frame) return null

  return (
    <div className="player">
      <div className="player-visual">
        {frame.array && <ArrayBoxes array={frame.array} marks={frame.marks} />}
        <Narration say={frame.say} />
      </div>
      <div className="player-code">
        <CodePanel code={code} language={language} onLanguageChange={setLanguage} line={frame.line} />
        <VariablesPanel vars={frame.vars} />
      </div>
      <Controls stepper={stepper} frameCount={frames.length} />
    </div>
  )
}
