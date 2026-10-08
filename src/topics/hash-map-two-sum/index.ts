import { listWithTargetEditor } from '../../engine/targetInputs'
import type { Topic } from '../../engine/types'
import { code } from './code'
import { record, type HashMapTwoSumInput } from './record'

/** Its id matches the "hash-map-two-sum" stage on the map. */
export const hashMapTwoSum: Topic<HashMapTwoSumInput> = {
  id: 'hash-map-two-sum',
  title: 'Hash map: Two Sum',
  code,
  // Unsorted, four misses (one is an item that would pair with itself), then a hit on a stored number.
  defaultInput: { nums: [7, 2, 5, 9, 3, 6], target: 10 },
  record,
  inputEditor: listWithTargetEditor({ label: 'List and target', maxLength: 8, min: -99, max: 99 }),
}
