import { useEffect, useRef, useState } from 'react'
import { useProgress } from '../progress/ProgressContext'

export function ResetProgress() {
  const { resetProgress } = useProgress()
  const [confirming, setConfirming] = useState(false)
  const resetButton = useRef<HTMLButtonElement>(null)
  const cancelButton = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)

  // Open on the safe choice; hand focus back to the Reset button when closing.
  useEffect(() => {
    if (confirming) cancelButton.current?.focus()
    else if (wasConfirming.current) resetButton.current?.focus()
    wasConfirming.current = confirming
  }, [confirming])

  if (!confirming) {
    return (
      <div className="reset-progress">
        <button ref={resetButton} type="button" className="btn" onClick={() => setConfirming(true)}>
          Reset progress
        </button>
      </div>
    )
  }

  return (
    <div
      className="reset-progress"
      role="group"
      aria-label="Confirm reset"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          // Close just this step, not a modal around it.
          e.preventDefault()
          e.stopPropagation()
          setConfirming(false)
        }
      }}
    >
      <p>Reset your stars, streak and badges? Your settings stay.</p>
      <div className="reset-actions">
        <button
          type="button"
          className="btn danger"
          onClick={() => {
            resetProgress()
            setConfirming(false)
          }}
        >
          Yes, reset
        </button>
        <button ref={cancelButton} type="button" className="btn" onClick={() => setConfirming(false)}>
          Cancel
        </button>
      </div>
    </div>
  )
}
