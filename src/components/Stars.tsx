import { StarIcon } from './Icons'

export function Stars({ count }: { count: 0 | 1 | 2 | 3 }) {
  return (
    <span className="stars" role="img" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((n) => (
        <StarIcon key={n} filled={n <= count} />
      ))}
    </span>
  )
}
