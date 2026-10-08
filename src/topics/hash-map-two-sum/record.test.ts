import { describe, expect, it } from 'vitest'
import type { Frame } from '../../engine/types'
import { record } from './record'

const asks = (frames: Frame[]) => frames.flatMap((f) => (f.ask ? [f.ask] : []))
const seenRow = (frame: Frame) => frame.rows![1]
const numsRow = (frame: Frame) => frame.rows![0]

/** What real code does: one pass with a Map from value to index, counting lookups. */
function reference(nums: number[], target: number) {
  const seen = new Map<number, number>()
  let lookups = 0
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]
    lookups++
    if (seen.has(complement)) return { result: [seen.get(complement)!, i], lookups, seen }
    seen.set(nums[i], i)
  }
  return { result: [] as number[], lookups, seen }
}

/** A small repeatable random source. */
function lcg(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

describe('hash map two sum: the default list [7, 2, 5, 9, 3, 6] with target 10', () => {
  const nums = [7, 2, 5, 9, 3, 6]
  const frames = record({ nums, target: 10 })

  it('makes a complement step, a lookup step and a store step per item, then returns on the hit', () => {
    expect(frames.map((f) => f.line)).toEqual([1, 2, 4, 5, 8, 4, 5, 8, 4, 5, 8, 4, 5, 8, 4, 5, 6])
  })

  it('starts by calling twoSumHash, saying the order does not matter', () => {
    expect(frames[0].say).toBe('Call twoSumHash with [7, 2, 5, 9, 3, 6] and target 10. The list can be in any order.')
    expect(frames[0].vars).toEqual({ nums, target: 10 })
    expect(numsRow(frames[0])).toEqual({ label: 'nums', values: nums, marks: {} })
  })

  it('creates an empty Map whose boxes will show each value with the index it maps to', () => {
    expect(frames[1].say).toBe('Create an empty Map called seen. It will remember each number and the index it was at.')
    expect(frames[1].vars).toEqual({ nums, target: 10, lookups: 0 })
    expect(seenRow(frames[1])).toMatchObject({ label: 'seen (value → index)', values: [], indexes: [] })
  })

  it('works out the complement of the current item and marks the item', () => {
    expect(frames[2].say).toBe('The partner of 7 must be 10 - 7 = 3, so 3 is what we look for.')
    expect(frames[2].vars).toEqual({ nums, target: 10, i: 0, complement: 3, lookups: 0 })
    expect(numsRow(frames[2]).marks).toEqual({ 0: 'current' })
  })

  it('looks the complement up, counts the lookup and finds nothing in an empty Map', () => {
    expect(frames[3].say).toBe('seen.has(3) looks in the Map in one step: 3 is not there, so no earlier number pairs with 7.')
    expect(frames[3].vars).toEqual({ nums, target: 10, i: 0, complement: 3, lookups: 1 })
  })

  it('stores the item with its index when there was no partner', () => {
    expect(frames[4].say).toBe('7 has no partner yet, so seen.set(7, 0) stores it with its index for later items to find.')
    expect(seenRow(frames[4])).toMatchObject({ values: [7], indexes: [0], marks: { 0: 'current' } })
  })

  it('does not pair an item with itself: 5 looks for 5, which is not stored yet', () => {
    // item 2 (5): complement, lookup
    expect(frames[8].say).toBe('The partner of 5 must be 10 - 5 = 5, so 5 is what we look for.')
    expect(frames[9].say).toBe(
      'seen.has(5) looks in the Map in one step: 5 is not there, so no earlier number pairs with 5. An item is stored only after its lookup, so it can never pair with itself.',
    )
    expect(seenRow(frames[9]).values).toEqual([7, 2])
  })

  it('fills the Map one item at a time, with the index each value maps to', () => {
    expect(seenRow(frames[7])).toMatchObject({ values: [7, 2], indexes: [0, 1] })
    expect(seenRow(frames[13])).toMatchObject({ values: [7, 2, 5, 9], indexes: [0, 1, 2, 3] })
  })

  it('finds 7 in the Map for the item 3: both boxes and the stored partner light up', () => {
    const lookup = frames[15]
    expect(lookup.say).toBe('seen.has(7) looks in the Map in one step: 7 is there, stored at index 0, and 7 + 3 = 10.')
    expect(lookup.vars).toEqual({ nums, target: 10, i: 4, complement: 7, lookups: 5 })
    expect(numsRow(lookup).marks).toEqual({ 0: 'done', 4: 'done' })
    expect(seenRow(lookup).marks).toEqual({ 0: 'done' })
  })

  it('returns the stored index then this one, and compares lookups with the pairs nested loops could need', () => {
    const last = frames.at(-1)!
    expect(last.line).toBe(6)
    expect(last.say).toBe(
      'Return [0, 4]: the stored index first, then this one. That took 5 lookups; nested loops could have needed up to 15 pairs. It works on any order but the Map holds up to n items, where two pointers needs a sorted list and no extra memory.',
    )
    expect(last.vars).toEqual({ nums, target: 10, i: 4, complement: 7, lookups: 5, result: [0, 4] })
    expect(numsRow(last).marks).toEqual({ 0: 'done', 4: 'done' })
  })

  it('asks what complement to look for on the second item, and whether the Map has it on the third and at the hit', () => {
    const questions = asks(frames).map((a) => a.question)
    expect(questions).toEqual([
      'The target is 10 and this number is 2. What complement do we look for?',
      'Is 5 already stored in the Map?',
      'Is 7 already stored in the Map?',
    ])
  })

  it('puts the questions on the right steps and never on the first', () => {
    expect(frames[0].ask).toBeUndefined()
    expect(frames[5].ask?.options[frames[5].ask.answer]).toBe('8')
    expect(frames[9].ask?.options).toHaveLength(2)
    expect(frames[9].ask?.options[frames[9].ask.answer]).toBe('No')
    expect(frames[15].ask?.options[frames[15].ask.answer]).toBe('Yes')
    expect(frames[15].ask?.explain).toBe('7 was stored at index 0 earlier, so the lookup finds it.')
    expect(frames[9].ask?.explain).toBe('The Map holds only [7, 2], so 5 is not there yet.')
  })
})

describe('hash map two sum: edge lists', () => {
  it('an empty list has nothing to look up', () => {
    const frames = record({ nums: [], target: 4 })
    expect(frames.map((f) => f.line)).toEqual([1, 2, 10])
    expect(frames.at(-1)!.say).toBe('The list is empty, so there is nothing to look up: return [].')
    expect(frames.at(-1)!.vars).toMatchObject({ lookups: 0, result: [] })
    expect(asks(frames)).toHaveLength(0)
  })

  it('one item is looked up once, finds nothing and is stored; the run ends with []', () => {
    const frames = record({ nums: [5], target: 5 })
    expect(frames.map((f) => f.line)).toEqual([1, 2, 4, 5, 8, 10])
    expect(frames.at(-1)!.say).toBe(
      'Every item has been looked up and none found a partner, so return []. That took 1 lookup, against 0 pairs for nested loops, and the Map ended up holding 1 item.',
    )
    expect(frames.at(-1)!.vars).toMatchObject({ lookups: 1, result: [] })
  })

  it('[3, 3] with target 6 pairs the second 3 with the stored first 3', () => {
    const frames = record({ nums: [3, 3], target: 6 })
    expect(frames.map((f) => f.line)).toEqual([1, 2, 4, 5, 8, 4, 5, 6])
    expect(frames.at(-1)!.vars).toMatchObject({ result: [0, 1], lookups: 2 })
    expect(frames.at(-2)!.say).toBe('seen.has(3) looks in the Map in one step: 3 is there, stored at index 0, and 3 + 3 = 6.')
  })

  it('handles negative numbers in the sums and the complement', () => {
    const frames = record({ nums: [-3, 8], target: 4 })
    expect(frames[2].say).toBe('The partner of -3 must be 4 - (-3) = 7, so 7 is what we look for.')
    expect(frames.at(-1)!.vars).toMatchObject({ result: [], lookups: 2 })
    const found = record({ nums: [8, -3], target: 5 })
    expect(found.at(-2)!.say).toBe('seen.has(8) looks in the Map in one step: 8 is there, stored at index 0, and 8 + (-3) = 5.')
    expect(found.at(-1)!.vars).toMatchObject({ result: [0, 1] })
  })

  it('no pair: every item is looked up and stored, then it returns []', () => {
    const frames = record({ nums: [1, 2, 4], target: 100 })
    expect(frames.map((f) => f.line)).toEqual([1, 2, 4, 5, 8, 4, 5, 8, 4, 5, 8, 10])
    expect(frames.at(-1)!.vars).toMatchObject({ lookups: 3, result: [] })
    expect(seenRow(frames.at(-1)!)).toMatchObject({ values: [1, 2, 4], indexes: [0, 1, 2] })
  })

  it('a pair that only the very last item completes takes every lookup', () => {
    const frames = record({ nums: [8, -3, 5, 1], target: 6 })
    expect(frames.at(-1)!.vars).toMatchObject({ result: [2, 3], lookups: 4 })
  })

  it('storing a repeated value replaces its index in place instead of adding a box', () => {
    const frames = record({ nums: [2, 2, 9], target: 20 })
    const store = frames.filter((f) => f.line === 8)[1]
    expect(store.say).toBe('2 is already in the Map (at index 0), so seen.set(2, 1) replaces its index with 1.')
    expect(seenRow(store)).toMatchObject({ values: [2], indexes: [1], marks: { 0: 'current' } })
  })

  it('a repeated value that is the partner is found at its latest index', () => {
    // 4 is stored at 0, replaced at 2; item 3 (6) looks for 4 and finds index 2
    const frames = record({ nums: [4, 1, 4, 6], target: 10 })
    expect(frames.at(-1)!.vars).toMatchObject({ result: [2, 3] })
    expect(frames.at(-2)!.say).toContain('stored at index 2')
  })
})

describe('hash map two sum: against the real algorithm', () => {
  it('returns the same indexes and counts the same lookups for many generated lists and targets', () => {
    const rng = lcg(11)
    let found = 0
    for (let trial = 0; trial < 400; trial++) {
      const length = Math.floor(rng() * 9)
      const nums = Array.from({ length }, () => Math.floor(rng() * 21) - 10)
      const target = Math.floor(rng() * 31) - 12
      const expected = reference(nums, target)
      const frames = record({ nums, target })
      const last = frames.at(-1)!
      const label = `${JSON.stringify(nums)} target ${target}`

      expect(last.vars.result, label).toEqual(expected.result)
      expect(last.vars.lookups ?? 0, label).toBe(expected.lookups)
      if (expected.result.length) found++
      for (const frame of frames) {
        expect(frame.line).toBeGreaterThanOrEqual(1)
        expect(frame.line).toBeLessThanOrEqual(11)
        expect(frame.rows).toHaveLength(2)
      }
      // The Map after the last step matches the real Map (in the same order, with the same indexes).
      if (!expected.result.length) {
        expect(seenRow(last).values, label).toEqual([...expected.seen.keys()])
        expect(seenRow(last).indexes, label).toEqual([...expected.seen.values()])
      }
    }
    expect(found).toBeGreaterThan(80)
  })

  it('never has the current item in the Map before its lookup unless an equal value was stored earlier', () => {
    const rng = lcg(5)
    for (let trial = 0; trial < 200; trial++) {
      const nums = Array.from({ length: 1 + Math.floor(rng() * 8) }, () => Math.floor(rng() * 11) - 5)
      const target = Math.floor(rng() * 21) - 10
      for (const frame of record({ nums, target })) {
        if (frame.line !== 4 && frame.line !== 5) continue
        const i = frame.vars.i as number
        const earlier = [...new Set(nums.slice(0, i))]
        expect(seenRow(frame).values, `${JSON.stringify(nums)} i=${i}`).toEqual(earlier)
        for (const [pos, index] of seenRow(frame).indexes!.entries()) {
          expect(index).toBeLessThan(i)
          expect(nums[index]).toBe(seenRow(frame).values[pos])
          expect(index).toBe(nums.slice(0, i).lastIndexOf(seenRow(frame).values[pos]))
        }
      }
    }
  })

  it('marks only boxes that exist, and the hit step marks the stored partner in both rows', () => {
    const rng = lcg(23)
    for (let trial = 0; trial < 200; trial++) {
      const nums = Array.from({ length: Math.floor(rng() * 9) }, () => Math.floor(rng() * 11) - 5)
      const target = Math.floor(rng() * 21) - 10
      const frames = record({ nums, target })
      for (const frame of frames) {
        for (const index of Object.keys(numsRow(frame).marks ?? {})) expect(Number(index)).toBeLessThan(nums.length)
        for (const index of Object.keys(seenRow(frame).marks ?? {}))
          expect(Number(index)).toBeLessThan(seenRow(frame).values.length)
      }
      const { result } = reference(nums, target)
      if (result.length) {
        const last = frames.at(-1)!
        expect(Object.keys(numsRow(last).marks ?? {}).map(Number).sort()).toEqual([...result].sort())
        expect(Object.values(seenRow(last).marks ?? {})).toEqual(['done'])
      }
    }
  })

  it('asks two or three fair questions, and the right answers match what happens', () => {
    const rng = lcg(31)
    for (let trial = 0; trial < 200; trial++) {
      const nums = Array.from({ length: 2 + Math.floor(rng() * 7) }, () => Math.floor(rng() * 21) - 10)
      const target = Math.floor(rng() * 31) - 12
      const frames = record({ nums, target })
      const list = asks(frames)
      expect(list.length).toBeGreaterThanOrEqual(1)
      expect(list.length).toBeLessThanOrEqual(3)
      for (const frame of frames) {
        if (!frame.ask) continue
        const right = frame.ask.options[frame.ask.answer]
        const complement = frame.vars.complement as number
        const i = frame.vars.i as number
        if (frame.line === 4) expect(right, `${JSON.stringify(nums)} ${target}`).toBe(String(target - nums[i]))
        else expect(right).toBe(nums.slice(0, i).includes(complement) ? 'Yes' : 'No')
      }
    }
  })
})
