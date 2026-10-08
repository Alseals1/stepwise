import { describe, expect, it } from 'vitest'
import { binarySearch } from './index'

const editor = binarySearch.inputEditor!

describe('binary search input editor', () => {
  it('accepts up to ten sorted numbers and a target', () => {
    const parsed = editor.parse('1, 2, 3, 4, 5, 6, 7, 8, 9, 10 target 7')
    expect(parsed).toEqual({ ok: true, value: { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], target: 7 } })
    const tooMany = editor.parse('1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 target 7')
    expect(tooMany).toEqual({ ok: false, message: 'Use at most 10 numbers (you entered 11).' })
  })

  it('refuses an unsorted list and names binary search, not two pointers', () => {
    expect(editor.parse('1, 5, 3 target 4')).toEqual({
      ok: false,
      message: 'Put the list in order, smallest first: 5 is followed by 3. Binary search only works on a sorted list.',
    })
  })

  it('passes other refusals through', () => {
    expect(editor.parse('1, 3, 4')).toEqual({
      ok: false,
      message: 'Add the target after the list, like "1, 3, 4 target 5".',
    })
  })

  it('starts from the default example, in the field format', () => {
    expect(editor.format(binarySearch.defaultInput)).toBe('2, 5, 8, 12, 16, 23, 38, 56, 72, 91 target 23')
  })

  it('Random makes a sorted list that usually contains the target, and always parses back', () => {
    let seed = 7
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }
    let hits = 0
    for (let i = 0; i < 200; i++) {
      const value = editor.random(rng)
      expect(value.nums.length).toBeGreaterThanOrEqual(5)
      expect(value.nums.length).toBeLessThanOrEqual(10)
      expect(value.nums).toEqual([...value.nums].sort((a, b) => a - b))
      expect(editor.parse(editor.format(value))).toEqual({ ok: true, value })
      if (value.nums.includes(value.target)) hits++
    }
    expect(hits).toBeGreaterThan(110)
    expect(hits).toBeLessThan(190)
  })

  it('has extreme inputs that include the empty list and the longest list', () => {
    const extremes = editor.extremes()
    expect(extremes.some((e) => e.nums.length === 0)).toBe(true)
    expect(extremes.some((e) => e.nums.length === 10)).toBe(true)
  })
})
