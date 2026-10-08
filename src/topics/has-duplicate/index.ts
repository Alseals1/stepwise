import { numberListEditor } from '../../engine/inputs'
import type { Topic } from '../../engine/types'
import { bugs } from './bugs'
import { code } from './code'
import { record } from './record'

/** Its id matches the "has-duplicate" stage on the map. */
export const hasDuplicate: Topic<number[]> = {
  id: 'has-duplicate',
  title: 'Duplicate check: loops vs a Set',
  code,
  // Six different numbers, so the nested loops do all 15 comparisons and the gap is clear.
  defaultInput: [4, 7, 2, 9, 5, 1],
  record,
  inputEditor: numberListEditor({ label: 'List', maxLength: 6, min: -99, max: 99 }),
  bugs,
}
