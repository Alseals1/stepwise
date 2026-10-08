import { useId } from 'react'
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
      <p className="controls-step">
        Step {index + 1} of {frameCount}
      </p>
      <div className="controls-speed">
        <label htmlFor={speedId}>Speed</label>
        <input
          id={speedId}
          type="range"
          min={0.5}
          max={4}
          step={0.5}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <output htmlFor={speedId}>{speed}x</output>
      </div>
    </div>
  )
}
