import type { InputEditor } from '../../engine/inputs'
import { sortedListWithTargetEditor } from '../../engine/targetInputs'
import type { Topic } from '../../engine/types'
import { code } from './code'
import { record, type BinarySearchInput } from './record'

const MAX_LENGTH = 10

const shared = sortedListWithTargetEditor({ label: 'List and target', maxLength: MAX_LENGTH, min: -99, max: 99 })

/**
 * The shared sorted-list editor, with this topic's wording for the sorted-list refusal and a Random that
 * usually picks a target that is in the list (finding it is the interesting case here).
 */
const inputEditor: InputEditor<BinarySearchInput> = {
  ...shared,
  parse(text) {
    const result = shared.parse(text)
    if (result.ok) return result
    return { ok: false, message: result.message.replace('Two pointers only works', 'Binary search only works') }
  },
  random(rng = Math.random) {
    const length = 5 + Math.floor(rng() * (MAX_LENGTH - 4))
    const nums = Array.from({ length }, () => 1 + Math.floor(rng() * 99)).sort((a, b) => a - b)
    const target = rng() < 0.75 ? nums[Math.floor(rng() * length)] : Math.floor(rng() * 101)
    return { nums, target }
  },
  extremes() {
    const ten = Array.from({ length: MAX_LENGTH }, (_, i) => i + 1)
    return [
      ...shared.extremes(),
      { nums: ten, target: 1 }, // the first one
      { nums: ten, target: MAX_LENGTH }, // the last one
      { nums: ten, target: 0 }, // just below everything
    ]
  },
}

/** Its id matches the "binary-search" stage on the map. */
export const binarySearch: Topic<BinarySearchInput> = {
  id: 'binary-search',
  title: 'Binary search',
  code,
  // Drops the right half, then the left half, then finds it: 3 probes where a scan needs 6.
  defaultInput: { nums: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target: 23 },
  record,
  inputEditor,
}
