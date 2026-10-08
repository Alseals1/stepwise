import { useId } from 'react'
import type { StageState } from '../progress/progress'
import { Link } from '../router/Link'
import { topicPath } from '../router/parseRoute'
import { DifficultyDots } from './DifficultyDots'
import { CheckIcon, LockIcon } from './Icons'
import { Stars } from './Stars'

interface Props {
  states: StageState[]
  unlockAll: boolean
  onUnlockAll: (unlockAll: boolean) => void
}

function Node({ state, number }: { state: StageState; number: number }) {
  return (
    <span className="stage-node" aria-hidden="true">
      {state.status === 'completed' ? <CheckIcon /> : state.status === 'locked' ? <LockIcon /> : number}
    </span>
  )
}

function StatusText({ state }: { state: StageState }) {
  switch (state.status) {
    case 'open':
      return <span className="stage-status">Open</span>
    case 'completed':
      return <span className="stage-status">Completed</span>
    case 'locked':
      return <span className="stage-status">Locked. Finish {state.blockedBy} to unlock.</span>
    case 'coming-soon':
      return <span className="stage-status">Coming soon</span>
  }
}

function StageBody({ state }: { state: StageState }) {
  const { stage, status, stars, next } = state
  return (
    <div className="stage-body">
      <h3>{stage.title}</h3>
      <p className="stage-blurb">{stage.blurb}</p>
      <div className="stage-meta">
        <DifficultyDots level={stage.difficulty} />
        <StatusText state={state} />
        {status === 'completed' && stars && <Stars count={stars} />}
        {next && <span className="next-up">Next up</span>}
      </div>
    </div>
  )
}

export function LevelMap({ states, unlockAll, onUnlockAll }: Props) {
  const hintId = useId()
  return (
    <section className="level-map" aria-labelledby="level-map-title">
      <div className="level-map-head">
        <h2 id="level-map-title">Stages</h2>
        <label className="switch">
          <input
            type="checkbox"
            role="switch"
            checked={unlockAll}
            aria-describedby={hintId}
            onChange={(e) => onUnlockAll(e.target.checked)}
          />
          <span className="switch-track" aria-hidden="true" />
          <span>Unlock all topics</span>
        </label>
      </div>
      <p id={hintId} className="level-map-hint">
        Topics open in order. Switch this on to skip ahead.
      </p>
      <ol className="stages">
        {states.map((state, i) => (
          <li key={state.stage.id} className="stage" data-status={state.status} aria-label={state.stage.title}>
            {state.status === 'open' || state.status === 'completed' ? (
              <Link to={topicPath(state.stage.id)} className="stage-card">
                <Node state={state} number={i + 1} />
                <StageBody state={state} />
              </Link>
            ) : (
              <div className="stage-card">
                <Node state={state} number={i + 1} />
                <StageBody state={state} />
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
