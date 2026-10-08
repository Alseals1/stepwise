import { Link } from '../router/Link'
import { HOW_TO_PATH } from '../router/parseRoute'
import { QuestionIcon } from './Icons'

/** The header link to the How-to page. */
export function HowToLink() {
  return (
    <Link to={HOW_TO_PATH} className="chip chip-help">
      <QuestionIcon />
      How to use
    </Link>
  )
}
