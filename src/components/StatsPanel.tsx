import { useProgress } from '../progress/ProgressContext'

const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`

export function StatsPanel() {
  const { streak, longestStreak, freezeUsed } = useProgress()
  return (
    <section className="card stats-panel" aria-label="Streak">
      <dl>
        <div>
          <dt>Current streak</dt>
          <dd>{days(streak)}</dd>
        </div>
        <div>
          <dt>Best streak</dt>
          <dd>{days(longestStreak)}</dd>
        </div>
        <div>
          <dt>Weekly freeze</dt>
          <dd>{freezeUsed ? 'Used this week' : 'Ready'}</dd>
        </div>
      </dl>
    </section>
  )
}
