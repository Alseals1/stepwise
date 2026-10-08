import type { TopicContent } from '../topics/types'

export function WatchFirst({ video }: { video: TopicContent['watchFirst'] }) {
  if (!video) return null
  return (
    <p className="watch-first">
      <span className="watch-first-label">Watch first</span>
      <a href={video.url} target="_blank" rel="noopener noreferrer">
        {video.label}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </p>
  )
}
