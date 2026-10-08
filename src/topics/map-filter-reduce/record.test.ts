import { describe, expect, it } from 'vitest'
import type { Frame, Row } from '../../engine/types'
import { record } from './record'

const row = (frame: Frame, label: string): Row | undefined => frame.rows?.find((r) => r.label === label)
const marks = (frame: Frame, label: string) => row(frame, label)?.marks ?? {}
const asks = (frames: Frame[]) => frames.flatMap((f) => (f.ask ? [f.ask] : []))

describe('map, filter, reduce and find: the default list [3, 4, 8, 5, 12]', () => {
  const nums = [3, 4, 8, 5, 12]
  const frames = record(nums)

  it('runs the four methods one after the other, on their own lines', () => {
    expect(frames.map((f) => f.line)).toEqual([
      1, // the call
      2, 2, 2, 2, 2, 2, // map: five callbacks, then done
      3, 3, 3, 3, 3, 3, // filter
      4, 4, 4, 4, 4, 4, 4, // reduce: start, five callbacks, done
      5, 5, 5, // find: stops at the third item
      6, // return
    ])
  })

  it('starts by calling demo on the learner’s list', () => {
    expect(frames[0].say).toBe('Call demo with [3, 4, 8, 5, 12]. We will try four methods on this one list.')
    expect(row(frames[0], 'nums')?.values).toEqual(nums)
    expect(frames[0].vars).toEqual({ nums })
  })

  it('map: one callback per item, each result goes into a new list', () => {
    expect(frames[1].say).toBe('The callback gets n = 3 and returns 3 * 2 = 6, which goes into the new list.')
    expect(frames[1].vars).toMatchObject({ n: 3, doubled: [6] })
    expect(marks(frames[1], 'nums')).toEqual({ 0: 'current' })
    expect(row(frames[1], 'doubled')?.values).toEqual([6])
    expect(marks(frames[2], 'nums')).toEqual({ 0: 'done', 1: 'current' })
    expect(row(frames[5], 'doubled')?.values).toEqual([6, 8, 16, 10, 24])
    expect(frames[6].say).toBe('map is done: [3, 4, 8, 5, 12] became [6, 8, 16, 10, 24]. nums itself is unchanged.')
    expect(frames[6].vars).toMatchObject({ doubled: [6, 8, 16, 10, 24] })
    expect(row(frames[6], 'nums')?.values).toEqual(nums)
  })

  it('filter: keeps the items where the callback is true and drops the rest', () => {
    expect(frames[7].say).toBe('The callback gets n = 3: 3 > 5 is false, so 3 is left out.')
    expect(row(frames[7], 'big')?.values).toEqual([])
    expect(marks(frames[8], 'nums')).toEqual({ 0: 'dim', 1: 'current' })
    expect(frames[9].say).toBe('The callback gets n = 8: 8 > 5 is true, so 8 is kept.')
    expect(row(frames[9], 'big')?.values).toEqual([8])
    expect(frames[9].vars).toMatchObject({ n: 8, big: [8] })
    expect(marks(frames[12], 'nums')).toEqual({ 0: 'dim', 1: 'dim', 2: 'done', 3: 'dim', 4: 'done' })
    expect(frames[12].say).toBe('filter is done: it kept 2 items, [8, 12].')
  })

  it('reduce: starts from 0 and carries a running total through the list', () => {
    expect(frames[13].say).toBe('reduce starts with 0 as the total, then the callback runs once per item.')
    expect(row(frames[13], 'total')?.values).toEqual([0])
    expect(frames[14].say).toBe('sum is 0 and n is 3, so the callback returns 0 + 3 = 3, the new sum.')
    expect(frames[14].vars).toMatchObject({ sum: 0, n: 3 })
    expect(row(frames[14], 'total')?.values).toEqual([3])
    expect(row(frames[18], 'total')?.values).toEqual([32])
    expect(frames[19].say).toBe('reduce is done: the total is 32.')
    expect(frames[19].vars).toMatchObject({ total: 32 })
  })

  it('find: stops at the first match and never looks at the rest', () => {
    expect(frames[20].say).toBe('The callback gets n = 3: 3 > 5 is false, so find keeps looking.')
    expect(marks(frames[21], 'nums')).toEqual({ 0: 'dim', 1: 'current' })
    expect(frames[22].say).toBe('The callback gets n = 8: 8 > 5 is true, so find returns 8 and stops. The last 2 items are never looked at.')
    expect(marks(frames[22], 'nums')).toEqual({ 0: 'dim', 1: 'dim', 2: 'done' })
    expect(row(frames[22], 'first')?.values).toEqual([8])
    expect(frames[22].vars).toMatchObject({ first: 8 })
  })

  it('ends with all four results and how many items each method visited', () => {
    const last = frames.at(-1)!
    expect(last.say).toBe('Same list, four results. map, filter and reduce visited all 5 items; find stopped after 3.')
    expect(last.vars).toEqual({ nums, doubled: [6, 8, 16, 10, 24], big: [8, 12], total: 32, first: 8 })
  })

  it('asks four questions, one per method, never on the first step and never revealing the answer', () => {
    const questions = frames.flatMap((f, i) => (f.ask ? [[i, f.ask.question] as const] : []))
    expect(questions).toEqual([
      [1, 'How many items will the new list have?'],
      [7, 'How many items will filter keep?'],
      [14, 'What will the final total be?'],
      [20, 'How many items will find check before it stops?'],
    ])
    const correct = asks(frames).map((a) => a.options[a.answer])
    expect(correct).toEqual(['5', '2', '32', '3'])
  })

  it('does not change the list it was given', () => {
    const list = [3, 4, 8, 5, 12]
    record(list)
    expect(list).toEqual([3, 4, 8, 5, 12])
  })
})

describe('map, filter, reduce and find: edge lists', () => {
  it('an empty list: every method does nothing, reduce gives its starting 0, find gives undefined', () => {
    const frames = record([])
    expect(frames.map((f) => f.line)).toEqual([1, 2, 3, 4, 4, 5, 6])
    expect(frames[1].say).toBe('map has nothing to visit, so it returns an empty list.')
    expect(frames[2].say).toBe('filter has nothing to visit, so it returns an empty list.')
    expect(frames[4].say).toBe('There are no items, so reduce returns its starting value, 0.')
    expect(frames[5].say).toBe('There are no items, so find returns undefined.')
    expect(frames.at(-1)!.say).toBe('The list was empty, so every callback ran zero times and nothing was built.')
    expect(frames.at(-1)!.vars).toEqual({ nums: [], doubled: [], big: [], total: 0, first: undefined })
    expect(asks(frames)).toEqual([])
  })

  it('a list where nothing is big: filter keeps nothing and find gives undefined after checking every item', () => {
    const frames = record([1, 2])
    expect(frames.at(-1)!.vars).toMatchObject({ big: [], total: 3, first: undefined })
    expect(frames.at(-1)!.say).toBe('Same list, four results. map, filter and reduce visited all 2 items; find checked all 2 and found nothing.')
    const done = frames.find((f) => f.say.startsWith('filter is done'))!
    expect(done.say).toBe('filter is done: it kept 0 items, [].')
    const notFound = frames.find((f) => f.line === 5 && f.say.includes('undefined'))!
    expect(notFound.say).toBe('No item made the callback return true, so find returns undefined.')
  })

  it('a match on the very first item stops find after one', () => {
    const frames = record([9])
    expect(frames.at(-1)!.say).toBe('Same list, four results. map, filter and reduce visited all 1 item; find stopped after 1.')
  })

  it('writes negative numbers in brackets so the sums read correctly', () => {
    const frames = record([-5, 2])
    expect(frames[1].say).toBe('The callback gets n = -5 and returns (-5) * 2 = -10, which goes into the new list.')
    const reduceStep = frames.find((f) => f.say.startsWith('sum is -5'))!
    expect(reduceStep.say).toBe('sum is -5 and n is 2, so the callback returns (-5) + 2 = -3, the new sum.')
  })
})

describe('map, filter, reduce and find: results always agree with the real methods', () => {
  const lists: number[][] = Array.from({ length: 200 }, (_, i) =>
    Array.from({ length: i % 7 }, (_, j) => ((i * 7 + j * 13) % 25) - 10),
  )
  it.each(lists.map((l) => [JSON.stringify(l), l] as const))('%s', (_name, nums) => {
    const frames = record(nums)
    const last = frames.at(-1)!
    expect(last.vars).toEqual({
      nums,
      doubled: nums.map((n) => n * 2),
      big: nums.filter((n) => n > 5),
      total: nums.reduce((sum, n) => sum + n, 0),
      first: nums.find((n) => n > 5),
    })

    for (const frame of frames) {
      expect(row(frame, 'nums')?.values).toEqual(nums) // the original is never touched
      for (const r of frame.rows ?? []) {
        for (const index of Object.keys(r.marks ?? {})) expect(Number(index)).toBeLessThan(r.values.length)
      }
    }
    // find stops at the first match: it checks exactly as many items as the real method would.
    const checked = frames.filter((f) => f.line === 5 && f.vars.n !== undefined).length
    const firstMatch = nums.findIndex((n) => n > 5)
    expect(checked).toBe(firstMatch === -1 ? nums.length : firstMatch + 1)
  })

  it('every question has a correct, non-negative count where it asks for a count', () => {
    for (const nums of lists) {
      for (const ask of asks(record(nums))) {
        if (!/How many/.test(ask.question)) continue
        for (const option of ask.options) expect(Number(option)).toBeGreaterThanOrEqual(0)
      }
    }
  })
})
