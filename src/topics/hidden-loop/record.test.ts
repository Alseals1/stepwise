import { describe, expect, it } from 'vitest'
import type { Frame, Row } from '../../engine/types'
import { record } from './record'

const row = (frame: Frame, label: string): Row => frame.rows!.find((r) => r.label === label)!
const marks = (frame: Frame, label: string) => row(frame, label).marks ?? {}

/** What real code would do: includes stops at the first match. */
function reference(items: number[]) {
  const seen: number[] = []
  let comparisons = 0
  for (const item of items) {
    const index = seen.indexOf(item)
    if (index !== -1) return { returned: true, comparisons: comparisons + index + 1 }
    comparisons += seen.length
    seen.push(item)
  }
  return { returned: false, comparisons }
}

describe('hidden loop: a list with a duplicate, [3, 1, 4, 1]', () => {
  const frames = record([3, 1, 4, 1])

  it('has one step per comparison, so one line of code becomes many steps', () => {
    // start, then per item: pick + includes steps + push (or the match and the return)
    expect(frames.map((f) => f.line)).toEqual([
      1, // call
      3, 4, 5, // 3: pick, seen is empty, push
      3, 4, 5, // 1: pick, compare with 3, push
      3, 4, 4, 5, // 4: pick, compare with 3, compare with 1, push
      3, 4, 4, 4, // 1: pick, compare with 3, compare with 1 (a match), return true
    ])
  })

  it('starts by calling the function on the learner’s list', () => {
    expect(frames[0].say).toBe('Call hasDuplicate with [3, 1, 4, 1].')
    expect(row(frames[0], 'items').values).toEqual([3, 1, 4, 1])
    expect(row(frames[0], 'seen').values).toEqual([])
  })

  it('says includes has nothing to compare with when seen is empty', () => {
    expect(frames[1].say).toBe('Pick up the next item, 3.')
    expect(frames[2].say).toBe('seen is empty, so includes has nothing to compare with: 0 comparisons.')
    expect(frames[3].say).toBe('3 is new, so push adds it to seen.')
    expect(row(frames[3], 'seen').values).toEqual([3])
  })

  it('marks the item being worked on and the ones already done', () => {
    expect(marks(frames[1], 'items')).toEqual({ 0: 'current' })
    expect(marks(frames[4], 'items')).toEqual({ 0: 'done', 1: 'current' })
  })

  it('moves a cursor along seen, one comparison at a time, and counts each one', () => {
    expect(frames[5].say).toBe('includes compares 1 with 3: not equal, so it keeps looking.')
    expect(marks(frames[5], 'seen')).toEqual({ 0: 'current' })
    expect(frames[5].vars.comparisons).toBe(1)

    expect(frames[8].say).toBe('includes compares 4 with 3: not equal, so it keeps looking.')
    expect(frames[9].say).toBe('includes compares 4 with 1: not equal, so it keeps looking.')
    expect(marks(frames[9], 'seen')).toEqual({ 1: 'current' })
    expect(frames.map((f) => f.vars.comparisons)).toEqual([0, 0, 0, 0, 0, 1, 1, 1, 2, 3, 3, 3, 4, 5, 5])
  })

  it('stops at the first match, marks it, and then returns true right away', () => {
    expect(frames[12].say).toBe('includes compares 1 with 3: not equal, so it keeps looking.')
    expect(frames[13].say).toBe('includes compares 1 with 1: a match, so it stops right away.')
    expect(marks(frames[13], 'seen')).toEqual({ 1: 'done' })
    expect(frames[14].say).toBe('The condition is true, so return true runs and the function stops right away.')
    expect(frames[14].vars.returned).toBe(true)
    expect(frames).toHaveLength(15)
  })

  it('counts the same comparisons a real includes would make', () => {
    expect(frames.at(-1)!.vars.comparisons).toBe(5)
    expect(reference([3, 1, 4, 1])).toEqual({ returned: true, comparisons: 5 })
  })

  it('asks "how many comparisons?" before each includes, with the right answers', () => {
    const asked = frames.flatMap((f) => (f.ask ? [f.ask] : []))
    expect(asked.map((a) => a.question)).toEqual([
      'How many comparisons will includes make for 3?',
      'How many comparisons will includes make for 1?',
      'How many comparisons will includes make for 4?',
      'How many comparisons will includes make for 1?',
    ])
    expect(asked.map((a) => a.options[a.answer])).toEqual(['0', '1', '2', '2'])
  })

  it('explains the answers: all of seen, or only up to the first match', () => {
    const asked = frames.flatMap((f) => (f.ask ? [f.ask] : []))
    expect(asked[0].explain).toBe('seen is empty, so there is nothing to compare with.')
    expect(asked[1].explain).toBe('1 is not in seen, so includes checks all 1 element.')
    expect(asked[2].explain).toBe('4 is not in seen, so includes checks all 2 elements.')
    expect(asked[3].explain).toBe('includes stops at the first match, at index 1, so it makes 2 comparisons.')
  })

  it('asks on the first includes step, never on the pick step', () => {
    const askedLines = frames.flatMap((f, i) => (f.ask ? [[i, f.line] as const] : []))
    expect(askedLines.every(([, line]) => line === 4)).toBe(true)
  })
})

describe('hidden loop: a list with no duplicate, [4, 7, 2, 9]', () => {
  const frames = record([4, 7, 2, 9])

  it('compares every item with all of seen: 0 + 1 + 2 + 3 = 6 comparisons, then returns false', () => {
    expect(frames.at(-1)!.vars.comparisons).toBe(6)
    expect(frames.at(-1)!.line).toBe(7)
    expect(frames.at(-1)!.say).toBe('Every item was new, so return false.')
    expect(frames.at(-1)!.vars.returned).toBe(false)
    expect(frames).toHaveLength(17)
    expect(reference([4, 7, 2, 9])).toEqual({ returned: false, comparisons: 6 })
  })

  it('ends with seen holding every item', () => {
    expect(row(frames.at(-1)!, 'seen').values).toEqual([4, 7, 2, 9])
  })
})

describe('hidden loop: edge lists', () => {
  it('handles an empty list: nothing to read, so return false at once', () => {
    const frames = record([])
    expect(frames.map((f) => f.line)).toEqual([1, 7])
    expect(frames[0].say).toBe('Call hasDuplicate with [].')
    expect(frames.at(-1)!.vars).toMatchObject({ comparisons: 0, returned: false })
    expect(frames.some((f) => f.ask)).toBe(false)
  })

  it('handles one item', () => {
    const frames = record([5])
    expect(frames.map((f) => f.line)).toEqual([1, 3, 4, 5, 7])
    expect(frames.at(-1)!.vars).toMatchObject({ comparisons: 0, returned: false })
  })

  it('finds a duplicate straight away at the second item', () => {
    const frames = record([8, 8])
    expect(frames.at(-1)!.line).toBe(4)
    expect(frames.at(-1)!.vars).toMatchObject({ comparisons: 1, returned: true })
  })

  it('does not share state between runs', () => {
    const a = record([1, 2, 1])
    record([9, 9, 9])
    expect(record([1, 2, 1])).toEqual(a)
  })
})

describe('hidden loop: it always agrees with real code', () => {
  const lists: number[][] = Array.from({ length: 200 }, (_, i) =>
    Array.from({ length: i % 7 }, (_, j) => ((i * 7 + j * 13) % 5) - 2), // small range, so duplicates are common
  )
  it.each(lists.map((l) => [JSON.stringify(l), l] as const))('%s', (_name, items) => {
    const frames = record(items)
    const last = frames.at(-1)!
    const expected = reference(items)
    expect(last.vars.comparisons).toBe(expected.comparisons)
    expect(last.vars.returned).toBe(expected.returned)
    expect(last.line).toBe(expected.returned ? 4 : 7)
    for (const frame of frames) {
      const seen = row(frame, 'seen')
      for (const index of Object.keys(seen.marks ?? {})) expect(Number(index)).toBeLessThan(seen.values.length)
      expect(frame.vars.comparisons).toBeLessThanOrEqual(expected.comparisons)
    }
    // the count only ever goes up, by at most one per step
    const counts = frames.map((f) => f.vars.comparisons as number)
    counts.slice(1).forEach((count, i) => {
      expect(count - counts[i]).toBeGreaterThanOrEqual(0)
      expect(count - counts[i]).toBeLessThanOrEqual(1)
    })
  })
})
