import { BADGES } from '../progress/badges'
import { useProgress } from '../progress/ProgressContext'
import { Link } from '../router/Link'
import { FlameIcon, MedalIcon } from './Icons'

/** Streak and badge count, shown in the header on every page. */
export function Hud() {
  const { streak, progress } = useProgress()
  const earned = BADGES.filter((b) => b.id in progress.badges).length
  return (
    <div className="hud" role="group" aria-label="Your progress">
      <span className="chip chip-streak" data-active={streak > 0 ? 'true' : 'false'}>
        <FlameIcon />
        {streak > 0 ? `${streak}-day streak` : 'Start a streak'}
      </span>
      <Link to="/badges" className="chip chip-badges">
        <MedalIcon />
        {earned} of {BADGES.length} badges
      </Link>
    </div>
  )
}
