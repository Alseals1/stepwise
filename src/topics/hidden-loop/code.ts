import type { TopicCode } from '../../engine/types'

// Both versions must have the same number of lines (enforced by a test).
export const code: TopicCode = {
  js: `function hasDuplicate(items) {
  const seen = []
  for (const item of items) {
    if (seen.includes(item)) return true
    seen.push(item)
  }
  return false
}`,
  ts: `function hasDuplicate(items: number[]): boolean {
  const seen: number[] = []
  for (const item of items) {
    if (seen.includes(item)) return true
    seen.push(item)
  }
  return false
}`,
}
