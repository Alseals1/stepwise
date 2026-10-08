import { numberListEditor, type InputEditor } from './inputs'

export interface SortedListWithTarget {
  nums: number[]
  target: number
}

export interface SortedListWithTargetOptions {
  label: string
  maxLength: number
  min: number
  max: number
}

const MAX_TEXT_LENGTH = 200

const bad = (message: string) => ({ ok: false as const, message })

/**
 * An editor for a sorted list and a target in one field: "1, 3, 4, 6 target 10". The list must
 * already be in order (smallest first); an unsorted list is refused with the reason, not sorted
 * quietly, because "it needs a sorted list" is the lesson.
 */
export function sortedListWithTargetEditor({
  label,
  maxLength,
  min,
  max,
}: SortedListWithTargetOptions): InputEditor<SortedListWithTarget> {
  const list = numberListEditor({ label, maxLength, min, max })
  // Two numbers from the list can add up to anything between these.
  const targetMin = min * 2
  const targetMax = max * 2
  const hint = `Up to ${maxLength} whole numbers from ${min} to ${max}, in order, smallest first, then the word target and a number. Example: 1, 3, 4, 6, 8, 11 target 10.`
  const missingTarget = 'Add the target after the list, like "1, 3, 4 target 5".'

  const format = ({ nums, target }: SortedListWithTarget) =>
    nums.length > 0 ? `${nums.join(', ')} target ${target}` : `target ${target}`

  return {
    label,
    hint,

    parse(text) {
      if (text.length > MAX_TEXT_LENGTH) return bad(`That is too long. Use up to ${maxLength} short numbers.`)

      const match = /^(.*?)\btarget\b[\s:=]*(.*)$/is.exec(text)
      if (!match) return bad(missingTarget)
      const [, listText, targetText] = match

      const targetToken = targetText.trim().replace(/−/g, '-')
      if (targetToken === '') return bad('Add a number after the word "target".')
      if (!/^-?\d+$/.test(targetToken)) return bad(`The target must be one whole number (found "${targetToken}").`)
      const target = Number(targetToken) || 0 // `|| 0` turns -0 into 0
      if (target < targetMin || target > targetMax) {
        return bad(`The target must be between ${targetMin} and ${targetMax} (found ${target}).`)
      }

      const parsed = list.parse(listText)
      if (!parsed.ok) return parsed
      const nums = parsed.value
      const outOfOrder = nums.findIndex((n, i) => i > 0 && nums[i - 1] > n)
      if (outOfOrder !== -1) {
        return bad(
          `Put the list in order, smallest first: ${nums[outOfOrder - 1]} is followed by ${nums[outOfOrder]}. Two pointers only works on a sorted list.`,
        )
      }
      return { ok: true, value: { nums, target } }
    },

    format,

    // Short sorted lists of small numbers; about three in four have a pair that hits the target.
    random(rng = Math.random) {
      const length = 4 + Math.floor(rng() * Math.min(5, maxLength - 3))
      const nums = Array.from({ length }, () => 1 + Math.floor(rng() * 20)).sort((a, b) => a - b)
      if (rng() < 0.75) {
        const a = Math.floor(rng() * (length - 1))
        const b = a + 1 + Math.floor(rng() * (length - a - 1))
        return { nums, target: nums[a] + nums[b] }
      }
      return { nums, target: 2 + Math.floor(rng() * 39) }
    },

    extremes() {
      const repeat = (length: number, value: number) => Array.from({ length }, () => value)
      return [
        { nums: [], target: 0 }, // nothing to search
        { nums: [5], target: 5 }, // one number can never pair
        { nums: [7, 7], target: 14 }, // equal numbers
        { nums: repeat(3, 0), target: 0 },
        { nums: repeat(maxLength, max), target: targetMax }, // everything at the top
        { nums: repeat(maxLength, min), target: targetMin }, // everything at the bottom
        { nums: [...repeat(Math.floor(maxLength / 2), min), ...repeat(Math.ceil(maxLength / 2), max)], target: 0 }, // far apart
        { nums: [1, 2, 3], target: targetMax }, // a target nobody can reach
        { nums: [1, 2, 3], target: targetMin },
      ]
    },
  }
}
