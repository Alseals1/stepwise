import type { BadgeDef } from '../progress/badges'
import { formatDay } from './formatDay'
import { LockIcon, MedalIcon } from './Icons'

interface Props {
  badge: BadgeDef
  /** The day it was earned, or undefined while locked. */
  earnedOn?: string
  /** False when this badge needs a topic that is not built yet. */
  topicBuilt: boolean
}

export function BadgeCard({ badge, earnedOn, topicBuilt }: Props) {
  const earned = earnedOn !== undefined
  return (
    <li className="badge-card card" aria-label={badge.title} data-earned={earned ? 'true' : 'false'}>
      <span className="badge-icon" aria-hidden="true">
        {earned ? <MedalIcon /> : <LockIcon />}
      </span>
      <div>
        <h2>{badge.title}</h2>
        {earned ? (
          <>
            <p>{badge.description}</p>
            <p className="badge-meta">Earned {formatDay(earnedOn)}</p>
          </>
        ) : (
          <>
            <p>Locked. {badge.hint}</p>
            {!topicBuilt && <p className="badge-meta">This topic isn&apos;t built yet.</p>}
          </>
        )}
      </div>
    </li>
  )
}
