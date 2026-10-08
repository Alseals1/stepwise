import { useEffect, useId, useRef } from 'react'
import type { Ask } from './types'

/** The question shown, in predict mode, before a step is revealed. */
export function PredictPanel({ ask, onChoose }: { ask: Ask; onChoose: (index: number) => void }) {
  const titleId = useId()
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    heading.current?.focus()
  }, [])

  return (
    <section className="predict-panel">
      <p className="predict-label">Your turn to predict</p>
      <h3 id={titleId} ref={heading} tabIndex={-1}>
        {ask.question}
      </h3>
      <div className="predict-options" role="group" aria-labelledby={titleId}>
        {ask.options.map((option, i) => (
          <button key={i} type="button" className="btn predict-option" onClick={() => onChoose(i)}>
            <kbd aria-hidden="true">{i + 1}</kbd>
            {option}
          </button>
        ))}
      </div>
      <p className="predict-hint">Press 1 – {ask.options.length} or click an answer.</p>
    </section>
  )
}

/**
 * Whether the guess was right, and why. Takes focus when the answer has just been given, so it is
 * read out; revisiting an answered step leaves focus alone.
 */
export function PredictFeedback({ ask, chosen, focus = true }: { ask: Ask; chosen: number; focus?: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const right = chosen === ask.answer

  useEffect(() => {
    if (focus) box.current?.focus()
  }, [focus])

  return (
    <div ref={box} className="predict-feedback" data-result={right ? 'right' : 'wrong'} tabIndex={-1}>
      <p className="predict-verdict">{right ? 'Right!' : `Not quite. The answer was ${ask.options[ask.answer]}.`}</p>
      <p>{ask.explain}</p>
    </div>
  )
}
