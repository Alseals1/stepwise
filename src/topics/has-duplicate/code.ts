import type { TopicCode } from '../../engine/types'

// Both versions must have the same number of lines (enforced by a test).
export const code: TopicCode = {
  js: `function hasDuplicateSlow(items) {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[i] === items[j]) return true
    }
  }
  return false
}

function hasDuplicateFast(items) {
  const seen = new Set()
  for (const item of items) {
    if (seen.has(item)) return true
    seen.add(item)
  }
  return false
}`,
  ts: `function hasDuplicateSlow(items: number[]): boolean {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[i] === items[j]) return true
    }
  }
  return false
}

function hasDuplicateFast(items: number[]): boolean {
  const seen = new Set<number>()
  for (const item of items) {
    if (seen.has(item)) return true
    seen.add(item)
  }
  return false
}`,
}
