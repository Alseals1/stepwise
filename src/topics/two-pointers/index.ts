import { sortedListWithTargetEditor } from '../../engine/targetInputs'
import type { Topic } from '../../engine/types'
import { code } from './code'
import { record, type TwoPointersInput } from './record'

/** Its id matches the "two-pointers" stage on the map. */
export const twoPointers: Topic<TwoPointersInput> = {
  id: 'two-pointers',
  title: 'Two pointers',
  code,
  // Both directions of movement, then a match: the same example the source lesson uses.
  defaultInput: { nums: [1, 3, 4, 6, 8, 11], target: 10 },
  record,
  inputEditor: sortedListWithTargetEditor({ label: 'List and target', maxLength: 8, min: -99, max: 99 }),
}
