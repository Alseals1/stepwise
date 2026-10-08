import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrayBoxes } from '../visuals/ArrayBoxes'
import { RowsView } from '../visuals/RowsView'
import { SeatRow } from '../visuals/SeatRow'
import { CodePanel } from './CodePanel'
import { Controls } from './Controls'
import { Narration } from './Narration'
import { PredictFeedback, PredictPanel } from './PredictPanel'
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
  /** Whether predict mode starts on, and a way to remember changes. */
  initialPredict?: boolean
  onPredictChange?: (enabled: boolean) => void
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
  initialPredict = false,
  onPredictChange,
  onRunComplete,
}: Props) {
  const [language, setLanguageState] = useState<Language>(initialLanguage)
  const [predictOn, setPredictOn] = useState(initialPredict)
  // This run's answers: frame index -> the option picked. They last until the run is restarted.
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [justAnswered, setJustAnswered] = useState<number | null>(null)
  const hasQuestions = frames.some((f) => f.ask)

  const gate = useCallback(
    (target: number) => predictOn && !!frames[target]?.ask && !(target in answers),
    [predictOn, frames, answers],
  )
  const base = useStepper(frames.length, { initialSpeed, onSpeedChange, gate })

  function newRun() {
    setAnswers({})
    setJustAnswered(null)
  }

  // A fresh run (Restart, or Play from the last step) starts with fresh questions and a fresh score.
  // Moving anywhere ends the "just answered" moment, so revisiting a step never grabs focus again.
  const stepper = {
    ...base,
    next: () => {
      setJustAnswered(null)
      base.next()
    },
    back: () => {
      setJustAnswered(null)
      base.back()
    },
    restart: () => {
      newRun()
      base.restart()
    },
    togglePlay: () => {
      setJustAnswered(null)
      if (base.isLast && !base.isPlaying) newRun()
      base.togglePlay()
    },
  }

  const choose = useCallback(
    (option: number) => {
      const target = base.pendingIndex
      if (target === null || option >= (frames[target].ask?.options.length ?? 0)) return
      setAnswers((a) => ({ ...a, [target]: option }))
      setJustAnswered(target)
      base.release()
    },
    [base, frames],
  )
  useStepperKeys({ ...stepper, choose })

  function setPredict(enabled: boolean) {
    setPredictOn(enabled)
    onPredictChange?.(enabled)
    if (!enabled) base.release() // never leave a question stranded
  }

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

  const pending = stepper.pendingIndex !== null ? frames[stepper.pendingIndex].ask : undefined
  const answered = answers[stepper.index]
  const answeredTotal = Object.keys(answers).length
  const answeredRight = Object.entries(answers).filter(([i, chosen]) => frames[Number(i)].ask?.answer === chosen).length

  return (
    <div className="player">
      <div className="player-visual" data-tour="picture">
        {frame.seats ? (
          <SeatRow seats={frame.seats} seatCount={frame.seatCount ?? frame.seats.length} />
        ) : frame.rows ? (
          <RowsView rows={frame.rows} />
        ) : (
          frame.array && <ArrayBoxes array={frame.array} marks={frame.marks} />
        )}
        <Narration say={frame.say} />
        {pending && <PredictPanel ask={pending} onChoose={choose} />}
        {!pending && frame.ask && answered !== undefined && (
          <PredictFeedback ask={frame.ask} chosen={answered} focus={justAnswered === stepper.index} />
        )}
      </div>
      <div className="player-code">
        <CodePanel code={code} language={language} onLanguageChange={setLanguage} line={frame.line} />
        <VariablesPanel vars={frame.vars} />
      </div>
      <Controls
        stepper={stepper}
        frameCount={frames.length}
        predict={hasQuestions ? { enabled: predictOn, onChange: setPredict } : undefined}
        score={{ right: answeredRight, total: answeredTotal }}
      />
    </div>
  )
}
