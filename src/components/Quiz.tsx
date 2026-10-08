import { useId, useState } from 'react'
import { starsFor } from '../progress/progress'
import type { QuizQuestion } from '../topics/types'
import { Stars } from './Stars'

interface Props {
  questions: QuizQuestion[]
  /** Called once each time the learner checks their answers. */
  onFinish: (correct: number, total: number) => void
}

export function Quiz({ questions, onFinish }: Props) {
  const baseId = useId()
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null))
  const [checked, setChecked] = useState(false)

  const allAnswered = picked.every((p) => p !== null)
  const correct = picked.filter((p, i) => p === questions[i].answer).length

  function check() {
    setChecked(true)
    onFinish(correct, questions.length)
  }

  function retry() {
    setPicked(questions.map(() => null))
    setChecked(false)
  }

  return (
    <section className="card quiz" aria-labelledby={`${baseId}-title`}>
      <h2 id={`${baseId}-title`}>Check yourself</h2>
      {questions.map((q, qi) => {
        const right = picked[qi] === q.answer
        return (
          <fieldset
            key={qi}
            className="quiz-question"
            data-result={checked ? (right ? 'right' : 'wrong') : undefined}
          >
            <legend>{q.question}</legend>
            {q.options.map((option, oi) => (
              <label key={oi} className="quiz-option">
                <input
                  type="radio"
                  name={`${baseId}-${qi}`}
                  checked={picked[qi] === oi}
                  disabled={checked}
                  onChange={() => setPicked((p) => p.map((v, i) => (i === qi ? oi : v)))}
                />
                <span>{option}</span>
              </label>
            ))}
            {checked && (
              <div className="quiz-feedback">
                <p className="quiz-verdict">{right ? 'Correct.' : `Not quite. The answer is ${q.options[q.answer]}.`}</p>
                <p>{q.explain}</p>
              </div>
            )}
          </fieldset>
        )
      })}
      <div className="quiz-footer">
        {!checked && (
          <>
            <button type="button" className="btn primary" onClick={check} disabled={!allAnswered}>
              Check answers
            </button>
            {!allAnswered && <span className="quiz-hint">Answer every question to check.</span>}
          </>
        )}
        <div className="quiz-summary" aria-live="polite">
          {checked && (
            <>
              <p>
                You got {correct} of {questions.length}.
              </p>
              <Stars count={starsFor(correct, questions.length)} />
            </>
          )}
        </div>
        {checked && (
          <button type="button" className="btn" onClick={retry}>
            Try again
          </button>
        )}
      </div>
    </section>
  )
}
