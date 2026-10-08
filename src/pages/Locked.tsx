import { Link } from '../router/Link'
import { HOME_PATH } from '../router/parseRoute'
import { useDocumentTitle } from '../router/useDocumentTitle'

export function Locked({ blockedBy }: { blockedBy: string }) {
  useDocumentTitle('Locked')
  return (
    <div className="page-message">
      <h1 tabIndex={-1}>Locked</h1>
      <p>
        Finish {blockedBy} to unlock this topic, or switch on <strong>Unlock all topics</strong> on the map to skip
        ahead.
      </p>
      <Link to={HOME_PATH} className="back-link">
        ← Back to the map
      </Link>
    </div>
  )
}
