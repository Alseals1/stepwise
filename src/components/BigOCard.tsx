import type { TopicContent } from '../topics/types'

export function BigOCard({ bigO }: { bigO: TopicContent['bigO'] }) {
  return (
    <section className="card bigo-card" aria-labelledby="bigo-title">
      <h2 id="bigo-title">Big O</h2>
      <p>
        <strong>Time</strong> <code>{bigO.time}</code> because {bigO.timeBecause}
      </p>
      <p>
        <strong>Space</strong> <code>{bigO.space}</code> because {bigO.spaceBecause}
      </p>
    </section>
  )
}
