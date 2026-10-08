import type { TopicCode } from '../../engine/types'

// Both versions must have the same number of lines (enforced by a test).
export const code: TopicCode = {
  js: `function demo(nums) {
  const doubled = nums.map(n => n * 2)
  const big = nums.filter(n => n > 5)
  const total = nums.reduce((sum, n) => sum + n, 0)
  const first = nums.find(n => n > 5)
  return { doubled, big, total, first }
}`,
  ts: `function demo(nums: number[]) {
  const doubled = nums.map((n) => n * 2)
  const big = nums.filter((n) => n > 5)
  const total = nums.reduce((sum, n) => sum + n, 0)
  const first = nums.find((n) => n > 5)
  return { doubled, big, total, first }
}`,
}
