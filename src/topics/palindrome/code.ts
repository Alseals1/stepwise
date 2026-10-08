import type { TopicCode } from '../../engine/types'

// Both versions must have the same number of lines (enforced by a test).
export const code: TopicCode = {
  js: `function isPalindrome(str) {
  let front = 0
  let back = str.length - 1
  while (front < back) {
    if (str[front] !== str[back]) {
      return false
    }
    front++
    back--
  }
  return true
}`,
  ts: `function isPalindrome(str: string): boolean {
  let front = 0
  let back = str.length - 1
  while (front < back) {
    if (str[front] !== str[back]) {
      return false
    }
    front++
    back--
  }
  return true
}`,
}
