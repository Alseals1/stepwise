import type { TopicContent } from '../topics/types'

export function AnalogyCard({ analogy }: { analogy: TopicContent['analogy'] }) {
  return (
    <section className="card analogy-card" aria-labelledby="analogy-title">
      <h2 id="analogy-title">Analogy</h2>
      <p>{analogy.text}</p>
      <p className="analogy-breaks">
        <strong>Where the analogy breaks:</strong> <span>{analogy.breaks}</span>
      </p>
    </section>
  )
}
