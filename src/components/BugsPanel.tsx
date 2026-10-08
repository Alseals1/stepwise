import { useId } from 'react'

interface Props {
  bugs: { id: string; label: string; why: string }[]
  /** The bug being replayed, or null for the correct version. */
  activeId: string | null
  onSelect: (id: string) => void
  onBack: () => void
}

/** "Common bugs": one button per classic mistake, which replays the topic with that bug. */
export function BugsPanel({ bugs, activeId, onSelect, onBack }: Props) {
  const titleId = useId()
  const active = bugs.find((bug) => bug.id === activeId)

  return (
    <section className="card bugs-panel" aria-labelledby={titleId}>
      <h2 id={titleId}>Common bugs</h2>
      <p className="bugs-intro">Replay the code with a classic mistake and watch where it goes wrong.</p>
      <div className="bugs-buttons">
        {bugs.map((bug) => (
          <button
            key={bug.id}
            type="button"
            className="btn"
            aria-pressed={bug.id === activeId}
            onClick={() => onSelect(bug.id)}
          >
            {bug.label}
          </button>
        ))}
      </div>
      {/* Always in the page, so a screen reader announces the text when it appears. Not a role="status": only the narration is. */}
      <p className="bugs-why" aria-live="polite">
        {active && (
          <>
            <span className="label">Why it goes wrong</span> {active.why}
          </>
        )}
      </p>
      {active && (
        <button type="button" className="btn primary bugs-back" onClick={onBack}>
          Back to the correct version
        </button>
      )}
    </section>
  )
}
