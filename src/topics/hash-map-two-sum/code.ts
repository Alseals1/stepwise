import type { TopicCode } from '../../engine/types'

// Both versions must have the same number of lines (enforced by a test).
export const code: TopicCode = {
  js: `function twoSumHash(nums, target) {
  const seen = new Map()
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]
    if (seen.has(complement)) {
      return [seen.get(complement), i]
    }
    seen.set(nums[i], i)
  }
  return []
}`,
  ts: `function twoSumHash(nums: number[], target: number): number[] {
  const seen = new Map<number, number>()
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]
    if (seen.has(complement)) {
      return [seen.get(complement)!, i]
    }
    seen.set(nums[i], i)
  }
  return []
}`,
}
