import { BadgeCard } from '../components/BadgeCard'
import { BADGES } from '../progress/badges'
import { useProgress } from '../progress/ProgressContext'
import { Link } from '../router/Link'
import { HOME_PATH } from '../router/parseRoute'
import { useDocumentTitle } from '../router/useDocumentTitle'
import { stages } from '../topics/stages'

export function Badges() {
  useDocumentTitle('Badges')
  const { progress } = useProgress()
  const earned = BADGES.filter((b) => b.id in progress.badges).length

  return (
    <div className="badges-page">
      <Link to={HOME_PATH} className="back-link">
        ← Back to the map
      </Link>
      <h1 tabIndex={-1}>Badges</h1>
      <p className="page-intro">
        {earned} of {BADGES.length} earned
      </p>
      <ul className="badge-grid">
        {BADGES.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            earnedOn={progress.badges[badge.id]}
            topicBuilt={!badge.topicId || (stages.find((s) => s.id === badge.topicId)?.available ?? false)}
          />
        ))}
      </ul>
    </div>
  )
}
