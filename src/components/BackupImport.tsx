import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useProgress } from '../progress/ProgressContext'
import type { SavedState } from '../progress/state'
import { dayKey } from '../progress/streak'
import { FAILURE_MESSAGES, MAX_BACKUP_CHARS, parseBackup, summarize, type ParseFailure } from '../storage/backup'
import { formatDay } from './formatDay'

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

function describe(state: SavedState) {
  const { topics, bestStreak, badges } = summarize(state)
  return `${count(topics, 'topic')} completed, a best streak of ${count(bestStreak, 'day')} and ${count(badges, 'badge')}`
}

interface Reviewing {
  state: SavedState
  exportedAt: string
}

export function BackupImport() {
  const { progress, replaceProgress } = useProgress()
  const [text, setText] = useState('')
  const [error, setError] = useState<ParseFailure | null>(null)
  const [restored, setRestored] = useState(false)
  const [reviewing, setReviewing] = useState<Reviewing | null>(null)

  const heading = useRef<HTMLHeadingElement>(null)
  const cancelButton = useRef<HTMLButtonElement>(null)
  const wasReviewing = useRef(false)

  // Open the review on the safe choice; hand focus back to the section when it closes.
  useEffect(() => {
    if (reviewing) cancelButton.current?.focus()
    else if (wasReviewing.current) heading.current?.focus()
    wasReviewing.current = reviewing !== null
  }, [reviewing])

  function review(input: string) {
    const result = parseBackup(input)
    setRestored(false)
    if (!result.ok) {
      setError(result.reason)
      setReviewing(null)
      return
    }
    setError(null)
    setReviewing({ state: result.state, exportedAt: result.exportedAt })
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return
    if (file.size > MAX_BACKUP_CHARS) {
      setRestored(false)
      setError('too-large')
      input.value = ''
      return
    }
    const content = await file.text()
    input.value = '' // so the same file can be chosen again
    review(content)
  }

  function confirm() {
    if (!reviewing) return
    replaceProgress(reviewing.state)
    setReviewing(null)
    setText('')
    setError(null)
    setRestored(true)
  }

  const savedOn = reviewing?.exportedAt ? formatDay(dayKey(new Date(reviewing.exportedAt))) : null

  return (
    <div className="backup-import">
      <h3 ref={heading} tabIndex={-1}>
        Restore from a backup
      </h3>

      <label className="btn file-button">
        <span>Choose backup file</span>
        <input type="file" accept=".json,application/json" onChange={onFile} />
      </label>

      <label className="backup-paste">
        <span>Or paste your backup</span>
        <textarea
          rows={3}
          value={text}
          aria-invalid={error ? true : undefined}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <button type="button" className="btn" onClick={() => review(text)}>
        Review backup
      </button>

      <p className="backup-message" data-error={error ? 'true' : 'false'} aria-live="polite">
        {error ? FAILURE_MESSAGES[error] : restored ? 'Progress restored.' : ''}
      </p>

      {reviewing && (
        <div
          className="backup-review card"
          role="group"
          aria-label="Review backup"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              // Close just the review, not a modal around it.
              e.preventDefault()
              e.stopPropagation()
              setReviewing(null)
            }
          }}
        >
          <p>{savedOn ? `This backup was saved ${savedOn}.` : 'This backup has no save date.'}</p>
          <p>It has {describe(reviewing.state)}.</p>
          <p>Right now you have {describe(progress)}.</p>
          <p>Replacing overwrites your current progress. Download a backup first to keep it.</p>
          <div className="reset-actions">
            <button type="button" className="btn danger" onClick={confirm}>
              Replace my progress
            </button>
            <button ref={cancelButton} type="button" className="btn" onClick={() => setReviewing(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
