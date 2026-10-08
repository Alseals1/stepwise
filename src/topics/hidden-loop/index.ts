import { numberListEditor } from '../../engine/inputs'
import type { Topic } from '../../engine/types'
import { code } from './code'
import { record } from './record'

/** Its id matches the "hidden-loops" stage on the map. */
export const hiddenLoop: Topic<number[]> = {
  id: 'hidden-loops',
  title: 'The hidden loop',
  code,
  // A duplicate, so the early return is part of the first run the learner sees.
  defaultInput: [3, 1, 4, 1],
  record,
  inputEditor: numberListEditor({ label: 'List', maxLength: 6, min: -99, max: 99 }),
}
