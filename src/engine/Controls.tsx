import { useId } from 'react'
import { ProgressBar } from './ProgressBar'
import type { Stepper } from './useStepper'

interface Props {
  stepper: Stepper
  frameCount: number
  /** Present only for topics that have questions. */
  predict?: { enabled: boolean; onChange: (enabled: boolean) => void }
  /** This run's predictions, shown at the end. */
  score?: { right: number; total: number }
}

export function Controls({ stepper, frameCount, predict, score }: Props) {
  const speedId = useId()
  const { index, isPlaying, speed, isFirst, isLast, pendingIndex, next, back, restart, togglePlay, setSpeed } = stepper
  const waiting = pendingIndex !== null
  return (
    <div className="controls" data-tour="controls">
      <div className="controls-buttons">
        <button type="button" onClick={restart} disabled={isFirst}>
          Restart
        </button>
        <button type="button" onClick={back} disabled={isFirst}>
          Back
        </button>
        <button type="button" className="primary" onClick={togglePlay} disabled={waiting}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={next} disabled={isLast || waiting}>
          Next
        </button>
      </div>
      <div className="controls-progress">
        <p className="controls-step">
          Step {index + 1} of {frameCount}
        </p>
        <ProgressBar
          value={index + 1}
          max={frameCount}
          label="Step progress"
          valueText={`Step ${index + 1} of ${frameCount}`}
        />
        {isLast && <p className="run-complete">Run complete</p>}
        {isLast && score && score.total > 0 && (
          <p className="run-score">
            You predicted {score.right} of {score.total}.
          </p>
        )}
      </div>
      {predict && (
        <label className="switch predict-switch" data-tour="predict">
          <input
            type="checkbox"
            role="switch"
            checked={predict.enabled}
            onChange={(e) => predict.onChange(e.target.checked)}
          />
          <span className="switch-track" aria-hidden="true" />
          <span>Predict mode</span>
        </label>
      )}
      <div className="controls-speed">
        <label htmlFor={speedId}>Speed</label>
        <input
          id={speedId}
          type="range"
          min={0.5}
          max={4}
          step={0.5}
          value={speed}
          aria-valuetext={`${speed}x`}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span className="controls-speed-value" aria-hidden="true">
          {speed}x
        </span>
      </div>
    </div>
  )
}
