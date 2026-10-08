import { Link } from '../router/Link'
import { HOME_PATH } from '../router/parseRoute'
import { useDocumentTitle } from '../router/useDocumentTitle'

const MESSAGES = {
  unknown: "We couldn't find that page.",
  'not-built': "That topic is still being built. The map shows what's ready.",
}

export function NotFound({ reason }: { reason: keyof typeof MESSAGES }) {
  useDocumentTitle('Nothing here yet')
  return (
    <div className="page-message">
      <h1 tabIndex={-1}>Nothing here yet</h1>
      <p>{MESSAGES[reason]}</p>
      <Link to={HOME_PATH} className="back-link">
        ← Back to the map
      </Link>
    </div>
  )
}
