import { describe, expect, it } from 'vitest'
import { sortedListWithTargetEditor } from './targetInputs'

const editor = sortedListWithTargetEditor({ label: 'List and target', maxLength: 8, min: -99, max: 99 })
const parse = (text: string) => editor.parse(text)
const ok = (nums: number[], target: number) => ({ ok: true, value: { nums, target } })
const bad = (message: string) => ({ ok: false, message })

describe('sortedListWithTargetEditor.parse: accepted input', () => {
  it.each([
    ['1, 3, 4, 6, 8, 11 target 10', [1, 3, 4, 6, 8, 11], 10],
    ['1 3 4 target 5', [1, 3, 4], 5],
    ['1,3,4,target 5', [1, 3, 4], 5],
    ['  1 ,3;4   TARGET   5  ', [1, 3, 4], 5],
    ['1, 3, 4 target: 5', [1, 3, 4], 5],
    ['1, 3, 4 target = 5', [1, 3, 4], 5],
    ['-5, -2, 0, 7 target -7', [-5, -2, 0, 7], -7],
    ['2, 2, 2 target 4', [2, 2, 2], 4], // repeats are in order too
    ['target 5', [], 5], // an empty list
    ['7 target 7', [7], 7],
    ['−3, 5 target −3', [-3, 5], -3], // typographic minus signs
    ['99, 99 target 198', [99, 99], 198], // the limits
    ['-99, -99 target -198', [-99, -99], -198],
    ['1 2 3 4 5 6 7 8 target 9', [1, 2, 3, 4, 5, 6, 7, 8], 9],
  ])('accepts %j', (text, nums, target) => {
    expect(parse(text)).toEqual(ok(nums, target))
  })

  it('never gives back a negative zero', () => {
    const result = parse('-0, 1 target -0')
    expect(result.ok && Object.is(result.value.target, -0)).toBe(false)
    expect(result.ok && Object.is(result.value.nums[0], -0)).toBe(false)
  })
})

describe('sortedListWithTargetEditor.parse: rejected input, with a message that names the problem', () => {
  it.each([
    ['1, 3, 4', 'Add the target after the list, like "1, 3, 4 target 5".'],
    ['', 'Add the target after the list, like "1, 3, 4 target 5".'],
    ['1, 3, 4 targets 5', 'Add the target after the list, like "1, 3, 4 target 5".'],
    ['1, 3, 4 target', 'Add a number after the word "target".'],
    ['1, 3, 4 target   ', 'Add a number after the word "target".'],
    ['1, 3, 4 target five', 'The target must be one whole number (found "five").'],
    ['1, 3, 4 target 2.5', 'The target must be one whole number (found "2.5").'],
    ['1, 3, 4 target 5 6', 'The target must be one whole number (found "5 6").'],
    ['1, 3, 4 target +5', 'The target must be one whole number (found "+5").'],
    ['1, 3, 4 target 199', 'The target must be between -198 and 198 (found 199).'],
    ['1, 3, 4 target -199', 'The target must be between -198 and 198 (found -199).'],
    ['1, x, 4 target 5', '"x" isn’t a number.'],
    ['1, 2.5 target 5', '"2.5" isn’t a whole number.'],
    ['1, 100 target 5', 'Numbers must be between -99 and 99 (found 100).'],
    ['1 2 3 4 5 6 7 8 9 target 5', 'Use at most 8 numbers (you entered 9).'],
    [
      '1, 5, 3 target 4',
      'Put the list in order, smallest first: 5 is followed by 3. Two pointers only works on a sorted list.',
    ],
    [
      '9, 1 target 10',
      'Put the list in order, smallest first: 9 is followed by 1. Two pointers only works on a sorted list.',
    ],
  ])('rejects %j', (text, message) => {
    expect(parse(text)).toEqual(bad(message))
  })

  it('refuses very long text before reading it', () => {
    const result = parse('1, '.repeat(200) + 'target 5')
    expect(result.ok).toBe(false)
  })
})

describe('sortedListWithTargetEditor: hint, format, random and extremes', () => {
  it('has the label and a hint that explains the format with an example', () => {
    expect(editor.label).toBe('List and target')
    expect(editor.hint).toContain('Up to 8 whole numbers')
    expect(editor.hint).toContain('smallest first')
    expect(editor.hint).toContain('1, 3, 4, 6, 8, 11 target 10')
  })

  it('formats text that parses back to the same value', () => {
    for (const value of [
      { nums: [1, 3, 4, 6, 8, 11], target: 10 },
      { nums: [], target: 0 },
      { nums: [-5, -5, 2], target: -10 },
    ]) {
      expect(editor.format(value)).toBe(value.nums.length ? `${value.nums.join(', ')} target ${value.target}` : `target ${value.target}`)
      expect(parse(editor.format(value))).toEqual({ ok: true, value })
    }
  })

  it('makes random examples that are valid, sorted, short, and usually have an answer', () => {
    let withAnswer = 0
    for (let i = 0; i < 200; i++) {
      const value = editor.random()
      expect(parse(editor.format(value))).toEqual({ ok: true, value })
      expect(value.nums.length).toBeGreaterThanOrEqual(4)
      expect(value.nums.length).toBeLessThanOrEqual(8)
      const { nums, target } = value
      if (nums.some((a, x) => nums.some((b, y) => x < y && a + b === target))) withAnswer++
    }
    expect(withAnswer).toBeGreaterThan(110)
    expect(withAnswer).toBeLessThan(200) // some have no pair, which is worth seeing too
  })

  it('takes the random numbers from the rng it is given', () => {
    const fixed = editor.random(() => 0)
    expect(editor.random(() => 0)).toEqual(fixed)
  })

  it('has extremes that all parse, and cover the empty list, the limits and a target nobody can reach', () => {
    const extremes = editor.extremes()
    for (const value of extremes) expect(parse(editor.format(value))).toEqual({ ok: true, value })
    expect(extremes.some((v) => v.nums.length === 0)).toBe(true)
    expect(extremes.some((v) => v.nums.length === 1)).toBe(true)
    expect(extremes.some((v) => v.nums.length === 8 && v.nums.every((n) => n === 99) && v.target === 198)).toBe(true)
    expect(extremes.some((v) => v.target === -198)).toBe(true)
    expect(extremes.some((v) => v.nums.length >= 2 && v.nums[0] !== v.nums.at(-1))).toBe(true)
  })
})
