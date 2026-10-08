import type { TopicCode } from '../../engine/types'

// Both versions must have the same number of lines (enforced by a test).
export const code: TopicCode = {
  js: `function demo(seats) {
  seats.push(9)
  seats.unshift(1)
  seats.pop()
  seats.shift()
  return seats
}`,
  ts: `function demo(seats: number[]): number[] {
  seats.push(9)
  seats.unshift(1)
  seats.pop()
  seats.shift()
  return seats
}`,
}
