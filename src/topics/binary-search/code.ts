import type { TopicCode } from '../../engine/types'

// Both versions must have the same number of lines (enforced by a test).
export const code: TopicCode = {
  js: `function binarySearch(nums, target) {
  let low = 0
  let high = nums.length - 1
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (nums[mid] === target) return mid
    if (nums[mid] < target) low = mid + 1
    else high = mid - 1
  }
  return -1
}`,
  ts: `function binarySearch(nums: number[], target: number): number {
  let low = 0
  let high = nums.length - 1
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (nums[mid] === target) return mid
    if (nums[mid] < target) low = mid + 1
    else high = mid - 1
  }
  return -1
}`,
}
