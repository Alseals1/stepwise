import { numberListEditor } from '../../engine/inputs'
import type { Topic } from '../../engine/types'
import { code } from './code'
import { record } from './record'

export const arrayBasics: Topic<number[]> = {
  id: 'array-basics',
  title: 'Array basics',
  code,
  defaultInput: [3, 5, 8],
  record,
  // Up to 6 numbers, so the row never needs more than 8 seats and still fits a phone.
  inputEditor: numberListEditor({ label: 'Starting array', maxLength: 6, min: -99, max: 99 }),
}
