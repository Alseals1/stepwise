import { useId, useState } from 'react'
import type { EntryEditor, Run } from '../topics/registry'

interface Props {
  editor: EntryEditor
  /** Called with the new run when the learner applies their input, or asks for a random or the example one. */
  onRun: (run: Run) => void
}

/** "Try your own numbers": a text field with Apply, Random and Reset. */
export function InputPanel({ editor, onRun }: Props) {
  const fieldId = useId()
  const hintId = useId()
  const messageId = useId()
  const [text, setText] = useState(editor.example.text)
  const [error, setError] = useState('')

  function run(next: Run) {
    setText(next.text)
    setError('')
    onRun(next)
  }

  return (
    <section className="card input-panel" data-tour="input" aria-labelledby={`${fieldId}-title`}>
      <h2 id={`${fieldId}-title`}>Try your own {editor.label.toLowerCase()}</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const result = editor.apply(text)
          if (result.ok) run(result.run)
          else setError(result.message)
        }}
      >
        <label htmlFor={fieldId} className="input-label">
          {editor.label}
        </label>
        <div className="input-row">
          <input
            id={fieldId}
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            value={text}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${hintId} ${messageId}`}
            onChange={(event) => {
              setText(event.target.value)
              setError('')
            }}
          />
          <button type="submit" className="btn primary">
            Apply
          </button>
          <button type="button" className="btn" onClick={() => run(editor.random())}>
            Random
          </button>
          <button type="button" className="btn" onClick={() => run(editor.example)}>
            Reset
          </button>
        </div>
        <p id={hintId} className="input-hint">
          {editor.hint}
        </p>
        <p id={messageId} className="input-error" aria-live="polite">
          {error}
        </p>
      </form>
    </section>
  )
}
