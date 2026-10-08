import { describe, expect, it } from 'vitest'
import type { Frame } from '../../engine/types'
import { record } from './record'

const asks = (frames: Frame[]) => frames.flatMap((f) => (f.ask ? [f.ask] : []))
const dimCount = (frame: Frame) => Object.values(frame.marks ?? {}).filter((m) => m === 'dim').length

/** What real code does: the two-pointer loop, counting sums. */
function reference(nums: number[], target: number) {
  let left = 0
  let right = nums.length - 1
  let sums = 0
  while (left < right) {
    sums++
    const sum = nums[left] + nums[right]
    if (sum === target) return { result: [left, right], sums }
    if (sum < target) left++
    else right--
  }
  return { result: [] as number[], sums }
}

describe('two pointers: the default list [1, 3, 4, 6, 8, 11] with target 10', () => {
  const nums = [1, 3, 4, 6, 8, 11]
  const frames = record({ nums, target: 10 })

  it('sets the pointers up, then makes a sum and a decision each round', () => {
    expect(frames.map((f) => f.line)).toEqual([1, 2, 3, 5, 8, 5, 7, 5, 8, 5, 7, 5, 6])
  })

  it('starts by calling twoSumSorted with the list and the target', () => {
    expect(frames[0].say).toBe(
      'Call twoSumSorted with [1, 3, 4, 6, 8, 11] and target 10. The list is sorted, so we can start from both ends.',
    )
    expect(frames[0].array).toEqual(nums)
    expect(frames[0].pointers).toEqual([])
    expect(frames[0].vars).toEqual({ nums, target: 10 })
  })

  it('puts left on the smallest number and right on the biggest', () => {
    expect(frames[1].say).toBe('left starts at 0, on the smallest number.')
    expect(frames[1].pointers).toEqual([{ label: 'left', index: 0 }])
    expect(frames[2].say).toBe('right starts at 5, on the biggest number.')
    expect(frames[2].pointers).toEqual([
      { label: 'left', index: 0 },
      { label: 'right', index: 5 },
    ])
    expect(frames[2].vars).toMatchObject({ left: 0, right: 5 })
  })

  it('adds the two ends and counts the sum', () => {
    expect(frames[3].say).toBe('Add the two ends: 1 + 11 = 12. The target is 10.')
    expect(frames[3].marks).toEqual({ 0: 'current', 5: 'compare' })
    expect(frames[3].vars).toMatchObject({ left: 0, right: 5, sum: 12, sums: 1 })
  })

  it('a sum that is too big drops the right number for good and moves right left', () => {
    expect(frames[4].say).toBe(
      '12 is more than 10, so 11 is too big for every number still in play: drop it and move right one step left.',
    )
    expect(frames[4].pointers).toEqual([
      { label: 'left', index: 0 },
      { label: 'right', index: 4 },
    ])
    expect(frames[4].marks).toEqual({ 0: 'current', 4: 'compare', 5: 'dim' })
    expect(frames[4].vars).toMatchObject({ left: 0, right: 4, sum: 12, sums: 1 })
  })

  it('a sum that is too small drops the left number for good and moves left right', () => {
    expect(frames[5].say).toBe('Add the two ends: 1 + 8 = 9. The target is 10.')
    expect(frames[6].say).toBe(
      '9 is less than 10, so 1 is too small for every number still in play: drop it and move left one step right.',
    )
    expect(frames[6].marks).toEqual({ 0: 'dim', 1: 'current', 4: 'compare', 5: 'dim' })
  })

  it('finds the pair, shows it as done and returns both positions', () => {
    const found = frames[12]
    expect(found.say).toBe(
      '4 + 6 = 10, a match, so return [2, 3]. That took 5 sums; nested loops could have needed up to 15 pairs.',
    )
    expect(found.marks).toEqual({ 0: 'dim', 1: 'dim', 2: 'done', 3: 'done', 4: 'dim', 5: 'dim' })
    expect(found.vars).toMatchObject({ left: 2, right: 3, sum: 10, sums: 5, result: [2, 3] })
  })

  it('asks what happens next after every sum, with the right answer each time', () => {
    const questions = frames.flatMap((f, i) => (f.ask ? [[i, f.ask.question] as const] : []))
    expect(questions).toEqual([
      [4, '1 + 11 = 12 and the target is 10. What happens next?'],
      [6, '1 + 8 = 9 and the target is 10. What happens next?'],
      [8, '3 + 8 = 11 and the target is 10. What happens next?'],
      [10, '3 + 6 = 9 and the target is 10. What happens next?'],
      [12, '4 + 6 = 10 and the target is 10. What happens next?'],
    ])
    expect(asks(frames).map((a) => a.options[a.answer])).toEqual([
      'right moves left',
      'left moves right',
      'right moves left',
      'left moves right',
      'it is a match',
    ])
  })

  it('does not change the list it was given', () => {
    const list = [1, 3, 4]
    record({ nums: list, target: 5 })
    expect(list).toEqual([1, 3, 4])
  })
})

describe('two pointers: edge cases', () => {
  it('no pair: the pointers meet and the last number is ruled out too', () => {
    const frames = record({ nums: [1, 2, 3], target: 10 })
    expect(frames.map((f) => f.line)).toEqual([1, 2, 3, 5, 7, 5, 7, 10])
    expect(frames[6].pointers).toEqual([
      { label: 'left', index: 2 },
      { label: 'right', index: 2 },
    ])
    const last = frames.at(-1)!
    expect(last.say).toBe('left and right have met, so every number is ruled out and no pair adds up to 10: return [].')
    expect(last.marks).toEqual({ 0: 'dim', 1: 'dim', 2: 'dim' })
    expect(last.vars).toMatchObject({ result: [], sums: 2 })
  })

  it('an empty list has nothing to search', () => {
    const frames = record({ nums: [], target: 4 })
    expect(frames.map((f) => f.line)).toEqual([1, 2, 3, 10])
    expect(frames[1].say).toBe('left starts at 0, but the list is empty.')
    expect(frames[2].say).toBe('right starts at -1, before the start of the empty list.')
    expect(frames.every((f) => f.pointers?.length === 0)).toBe(true)
    expect(frames[3].say).toBe('A pair needs two numbers, and the list has none: return [].')
    expect(asks(frames)).toEqual([])
  })

  it('one number can never make a pair', () => {
    const frames = record({ nums: [5], target: 5 })
    expect(frames.map((f) => f.line)).toEqual([1, 2, 3, 10])
    expect(frames[2].pointers).toEqual([
      { label: 'left', index: 0 },
      { label: 'right', index: 0 },
    ])
    expect(frames[3].say).toBe('A pair needs two numbers, and the list has only one: return [].')
  })

  it('a pair of equal numbers is found at once', () => {
    const frames = record({ nums: [7, 7], target: 14 })
    expect(frames.map((f) => f.line)).toEqual([1, 2, 3, 5, 6])
    expect(frames.at(-1)!.say).toBe(
      '7 + 7 = 14, a match, so return [0, 1]. That took 1 sum; nested loops could have needed up to 1 pair.',
    )
  })

  it('writes negative numbers in brackets inside a sum', () => {
    const frames = record({ nums: [-5, 2], target: -3 })
    expect(frames[3].say).toBe('Add the two ends: (-5) + 2 = -3. The target is -3.')
  })
})

describe('two pointers: results always agree with real code', () => {
  const lists: [number[], number][] = []
  for (let i = 0; i < 240; i++) {
    const length = i % 9
    const nums = Array.from({ length }, (_, j) => ((i * 7 + j * 13) % 21) - 8).sort((a, b) => a - b)
    lists.push([nums, ((i * 5) % 31) - 12])
  }
  it.each(lists.map(([n, t]) => [`${JSON.stringify(n)} target ${t}`, n, t] as const))('%s', (_name, nums, target) => {
    const frames = record({ nums, target })
    const last = frames.at(-1)!
    const expected = reference(nums, target)
    expect(last.vars.result).toEqual(expected.result)
    expect(last.vars.sums ?? 0).toBe(expected.sums)

    for (const frame of frames) {
      expect(frame.array).toEqual(nums) // the list never changes
      for (const pointer of frame.pointers ?? []) {
        expect(pointer.index).toBeGreaterThanOrEqual(0)
        expect(pointer.index).toBeLessThan(nums.length)
      }
      for (const index of Object.keys(frame.marks ?? {})) expect(Number(index)).toBeLessThan(nums.length)
    }

    // Every move drops exactly one number for good: the faded count goes up by one per move.
    const moves = frames.filter((f) => f.line === 7 || f.line === 8)
    moves.forEach((move, i) => {
      expect(dimCount(move), `after move ${i + 1}`).toBe(i + 1)
    })
    // The number of sums is the number of "sum" steps.
    expect(frames.filter((f) => f.line === 5).length).toBe(expected.sums)
    // And the loop can never run more than n - 1 times.
    expect(expected.sums).toBeLessThanOrEqual(Math.max(nums.length - 1, 0))
  })
})
