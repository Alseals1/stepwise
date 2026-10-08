import { describe, expect, it } from 'vitest'
import type { Frame } from '../../engine/types'
import { record } from './record'

const asks = (frames: Frame[]) => frames.flatMap((f) => (f.ask ? [f.ask] : []))
const dimCount = (frame: Frame) => Object.values(frame.marks ?? {}).filter((m) => m === 'dim').length
const rangeSize = (frame: Frame) => Number(frame.vars.high) - Number(frame.vars.low) + 1

/** What real code does: the iterative loop, counting the middles it looks at. */
function reference(nums: number[], target: number) {
  let low = 0
  let high = nums.length - 1
  let probes = 0
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    probes++
    if (nums[mid] === target) return { result: mid, probes }
    if (nums[mid] < target) low = mid + 1
    else high = mid - 1
  }
  return { result: -1, probes }
}

const DEFAULT = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]

describe('binary search: the default list with target 23', () => {
  const frames = record({ nums: DEFAULT, target: 23 })

  it('sets low and high up, then picks a middle and decides each round', () => {
    expect(frames.map((f) => f.line)).toEqual([1, 2, 3, 5, 7, 5, 8, 5, 6])
  })

  it('starts by calling binarySearch with the list and the target', () => {
    expect(frames[0].say).toBe(
      'Call binarySearch with [2, 5, 8, 12, 16, 23, 38, 56, 72, 91] and target 23. The list is sorted, so each look can rule out half of it.',
    )
    expect(frames[0].array).toEqual(DEFAULT)
    expect(frames[0].pointers).toEqual([])
    expect(frames[0].vars).toEqual({ nums: DEFAULT, target: 23 })
  })

  it('puts low on the first position and high on the last', () => {
    expect(frames[1].say).toBe('low starts at 0, the first position.')
    expect(frames[1].pointers).toEqual([{ label: 'low', index: 0 }])
    expect(frames[2].say).toBe('high starts at 9, the last position.')
    expect(frames[2].pointers).toEqual([
      { label: 'low', index: 0 },
      { label: 'high', index: 9 },
    ])
    expect(frames[2].vars).toMatchObject({ low: 0, high: 9 })
  })

  it('looks at the middle and counts the probe', () => {
    expect(frames[3].say).toBe('Probe 1: the middle of positions 0 to 9 is position 4, which holds 16.')
    expect(frames[3].marks).toEqual({ 4: 'current' })
    expect(frames[3].pointers).toEqual([
      { label: 'low', index: 0 },
      { label: 'mid', index: 4 },
      { label: 'high', index: 9 },
    ])
    expect(frames[3].vars).toMatchObject({ low: 0, high: 9, mid: 4, probes: 1 })
  })

  it('a middle that is too small drops the left half and fades it', () => {
    expect(frames[4].say).toBe(
      '16 is less than 23, so 23 can only be to the right: drop the left half and set low to 5 (5 numbers left).',
    )
    expect(frames[4].vars).toMatchObject({ low: 5, high: 9, mid: 4, probes: 1 })
    expect(frames[4].marks).toEqual({ 0: 'dim', 1: 'dim', 2: 'dim', 3: 'dim', 4: 'dim' })
    expect(frames[4].pointers).toEqual([
      { label: 'low', index: 5 },
      { label: 'high', index: 9 },
    ])
  })

  it('a middle that is too big drops the right half and fades it', () => {
    expect(frames[5].say).toBe('Probe 2: the middle of positions 5 to 9 is position 7, which holds 56.')
    expect(frames[6].say).toBe(
      '56 is more than 23, so 23 can only be to the left: drop the right half and set high to 6 (2 numbers left).',
    )
    expect(frames[6].vars).toMatchObject({ low: 5, high: 6, probes: 2 })
    expect(frames[6].marks?.[9]).toBe('dim')
    expect(frames[6].marks?.[5]).toBeUndefined()
  })

  it('finds the target, shows it done and says what a plain scan would have cost', () => {
    expect(frames[7].say).toBe('Probe 3: the middle of positions 5 to 6 is position 5, which holds 23.')
    expect(frames[8].say).toBe(
      '23 is the target, so return 5. That took 3 probes; scanning from the left would have needed 6 comparisons.',
    )
    expect(frames[8].marks?.[5]).toBe('done')
    expect(frames[8].vars).toMatchObject({ mid: 5, probes: 3, result: 5 })
    expect(frames[8].pointers).toEqual([
      { label: 'low', index: 5 },
      { label: 'mid', index: 5 },
      { label: 'high', index: 6 },
    ])
  })

  it('asks "what happens next?" on every decision, with the right answer in different places', () => {
    expect(frames.map((f) => Boolean(f.ask))).toEqual([false, false, false, false, true, false, true, false, true])
    const questions = asks(frames)
    expect(questions.map((q) => q.question)).toEqual([
      'The middle is 16 and the target is 23. What happens next?',
      'The middle is 56 and the target is 23. What happens next?',
      'The middle is 23 and the target is 23. What happens next?',
    ])
    expect(questions.map((q) => q.options[q.answer])).toEqual([
      'search the right half',
      'search the left half',
      'stop, it is a match',
    ])
    expect(new Set(questions.map((q) => q.answer)).size).toBe(3)
    for (const q of questions) expect([...q.options].sort()).toEqual(
      ['search the left half', 'search the right half', 'stop, it is a match'].sort(),
    )
  })

  it('passes pointers in every frame so the boxes never jump', () => {
    for (const frame of frames) expect(Array.isArray(frame.pointers)).toBe(true)
  })

  it('has room for three tags under each box', () => {
    for (const frame of frames) expect(frame.pointerSlots).toBe(3)
  })
})

describe('binary search: edge cases', () => {
  it('a target that is not there ends with low past high and returns -1', () => {
    const frames = record({ nums: [1, 3, 5], target: 4 })
    const last = frames[frames.length - 1]
    expect(last.line).toBe(10)
    expect(last.say).toBe(
      'low (2) has passed high (1), so nothing is left to search: return -1. That took 2 probes; scanning from the left would have needed 3 comparisons.',
    )
    expect(last.vars).toMatchObject({ low: 2, high: 1, result: -1, probes: 2 })
    expect(Object.values(last.marks ?? {})).toEqual(['dim', 'dim', 'dim'])
  })

  it('an empty list skips the loop', () => {
    const frames = record({ nums: [], target: 4 })
    expect(frames.map((f) => f.line)).toEqual([1, 2, 3, 10])
    expect(frames[1].say).toBe('low starts at 0, but the list is empty.')
    expect(frames[2].say).toBe('high starts at -1, before the start of the empty list.')
    expect(frames[3].say).toBe(
      'The list is empty, so there is nothing to search: return -1 without a single probe.',
    )
    for (const frame of frames) expect(frame.pointers).toEqual([])
  })

  it('one item: found in one probe, or not found in one', () => {
    const hit = record({ nums: [7], target: 7 })
    expect(hit[hit.length - 1].say).toBe(
      '7 is the target, so return 0. That took 1 probe; scanning from the left would have needed 1 comparison.',
    )
    const miss = record({ nums: [7], target: 9 })
    expect(miss[miss.length - 1].vars).toMatchObject({ result: -1, probes: 1 })
  })

  it('a target smaller than everything keeps dropping the right half', () => {
    const frames = record({ nums: DEFAULT, target: -5 })
    expect(frames[frames.length - 1].vars).toMatchObject({ result: -1, probes: 3 })
    expect(frames.filter((f) => f.line === 8)).toHaveLength(3)
    expect(frames.filter((f) => f.line === 7)).toHaveLength(0)
  })

  it('a target bigger than everything keeps dropping the left half', () => {
    const frames = record({ nums: DEFAULT, target: 99 })
    expect(frames[frames.length - 1].vars).toMatchObject({ result: -1, probes: 4 })
    expect(frames.filter((f) => f.line === 7)).toHaveLength(4)
  })

  it('negative numbers read correctly', () => {
    const frames = record({ nums: [-9, -4, 0], target: -4 })
    expect(frames[frames.length - 1].say).toContain('-4 is the target, so return 1.')
  })
})

describe('binary search: against a plain reference over many generated lists', () => {
  // A small deterministic generator, so a failure can be reproduced.
  let seed = 12345
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  const cases: { nums: number[]; target: number }[] = []
  for (let i = 0; i < 300; i++) {
    const length = Math.floor(rng() * 11)
    const nums = Array.from({ length }, () => Math.floor(rng() * 30) - 10).sort((a, b) => a - b) // duplicates happen
    const target = rng() < 0.6 && length > 0 ? nums[Math.floor(rng() * length)] : Math.floor(rng() * 40) - 15
    cases.push({ nums, target })
  }

  it('returns the same index (or -1) and the same probe count', () => {
    for (const { nums, target } of cases) {
      const frames = record({ nums, target })
      const last = frames[frames.length - 1]
      const expected = reference(nums, target)
      expect(last.vars.result, JSON.stringify({ nums, target })).toBe(expected.result)
      expect(last.vars.probes ?? 0, JSON.stringify({ nums, target })).toBe(expected.probes)
    }
  })

  it('the search space shrinks every round and probes never beat the log2 bound', () => {
    for (const { nums, target } of cases) {
      const frames = record({ nums, target })
      const mids = frames.filter((f) => f.line === 5)
      const sizes = mids.map(rangeSize)
      for (let i = 1; i < sizes.length; i++) {
        // The next round starts with at most half of what the last round had, rounded down.
        expect(sizes[i], JSON.stringify({ nums, target })).toBeLessThanOrEqual(Math.floor(sizes[i - 1] / 2))
      }
      const bound = nums.length === 0 ? 0 : Math.floor(Math.log2(nums.length)) + 1
      expect(mids.length).toBeLessThanOrEqual(bound)
    }
  })

  it('keeps every pointer inside the list and fades exactly the numbers outside low..high', () => {
    for (const { nums, target } of cases) {
      for (const frame of record({ nums, target })) {
        for (const pointer of frame.pointers ?? []) {
          expect(pointer.index).toBeGreaterThanOrEqual(0)
          expect(pointer.index).toBeLessThan(nums.length)
        }
        if (frame.vars.low !== undefined && frame.vars.high !== undefined) {
          const low = Number(frame.vars.low)
          const high = Number(frame.vars.high)
          const outside = nums.filter((_, i) => i < low || i > high).length
          expect(dimCount(frame)).toBe(outside)
        }
      }
    }
  })

  it('every decision frame has a question whose answer matches what happens', () => {
    for (const { nums, target } of cases) {
      const frames = record({ nums, target })
      for (const frame of frames.filter((f) => f.ask)) {
        const answer = frame.ask!.options[frame.ask!.answer]
        const expected = frame.line === 6 ? 'stop, it is a match' : frame.line === 7 ? 'search the right half' : 'search the left half'
        expect(answer).toBe(expected)
      }
    }
  })
})
