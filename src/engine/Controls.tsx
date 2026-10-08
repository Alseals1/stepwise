import { useId } from 'react'
import { ProgressBar } from './ProgressBar'
import type { Stepper } from './useStepper'

interface Props {
  stepper: Stepper
  frameCount: number
}

export function Controls({ stepper, frameCount }: Props) {
  const speedId = useId()
  const { index, isPlaying, speed, isFirst, isLast, next, back, restart, togglePlay, setSpeed } = stepper
  return (
    <div className="controls">
      <div className="controls-buttons">
        <button type="button" onClick={restart} disabled={isFirst}>
          Restart
        </button>
        <button type="button" onClick={back} disabled={isFirst}>
          Back
        </button>
        <button type="button" className="primary" onClick={togglePlay}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={next} disabled={isLast}>
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
      </div>
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
