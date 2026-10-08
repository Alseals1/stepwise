import type { TopicCode } from '../../engine/types'

// Both versions must have the same number of lines (enforced by a test).
export const code: TopicCode = {
  js: `function sum(numbers) {
  let total = 0
  for (const n of numbers) {
    total += n
  }
  return total
}`,
  ts: `function sum(numbers: number[]): number {
  let total = 0
  for (const n of numbers) {
    total += n
  }
  return total
}`,
}
