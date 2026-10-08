import { describe, expect, it } from 'vitest'
import type { Frame, Row } from '../../engine/types'
import { record } from './record'

const row = (frame: Frame, label: string): Row | undefined => frame.rows?.find((r) => r.label === label)
const marks = (frame: Frame, label: string) => row(frame, label)?.marks ?? {}

/** What real code does. */
function nestedLoops(items: number[]) {
  let comparisons = 0
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      comparisons++
      if (items[i] === items[j]) return { comparisons, result: true }
    }
  }
  return { comparisons, result: false }
}
function withASet(items: number[]) {
  const seen = new Set<number>()
  let lookups = 0
  for (const item of items) {
    lookups++
    if (seen.has(item)) return { lookups, result: true }
    seen.add(item)
  }
  return { lookups, result: false }
}

describe('duplicate check: a list with a repeat, [3, 1, 3]', () => {
  const frames = record([3, 1, 3])

  it('runs the nested loops first, then the Set, line by line', () => {
    expect(frames.map((f) => f.line)).toEqual([1, 4, 4, 4, 10, 13, 14, 13, 14, 13, 13])
  })

  it('starts by calling the nested-loops function on the learner’s list', () => {
    expect(frames[0].say).toBe('Call hasDuplicateSlow with [3, 1, 3].')
    expect(row(frames[0], 'items')?.values).toEqual([3, 1, 3])
    expect(row(frames[0], 'seen')).toBeUndefined() // the Set only appears in part 2
  })

  it('compares each pair, marking the outer item and the inner item differently', () => {
    expect(frames[1].say).toBe('Compare items[0] = 3 with items[1] = 1: not equal.')
    expect(marks(frames[1], 'items')).toEqual({ 0: 'current', 1: 'compare' })
    expect(frames[1].vars).toMatchObject({ i: 0, j: 1, comparisons: 1 })
    expect(frames[2].say).toBe('Compare items[0] = 3 with items[2] = 3: equal, so this is a duplicate.')
    expect(marks(frames[2], 'items')).toEqual({ 0: 'done', 2: 'done' })
    expect(frames[2].vars).toMatchObject({ i: 0, j: 2, comparisons: 2 })
  })

  it('stops the nested loops at the first equal pair', () => {
    expect(frames[3].say).toBe('Found an equal pair, so return true and the function stops right away.')
    expect(frames[3].vars).toMatchObject({ comparisons: 2, returned: true })
  })

  it('then runs the same list with a Set, one lookup per item, adding the new ones', () => {
    expect(frames[4].say).toBe('Now the same list with a Set: call hasDuplicateFast with [3, 1, 3].')
    expect(row(frames[4], 'seen')?.values).toEqual([])
    expect(frames[4].vars).toMatchObject({ comparisons: 2, lookups: 0 })
    expect(frames[4].vars.returned).toBeUndefined() // a new function, so no result yet

    expect(frames[5].say).toBe('seen.has(3) looks the item up in one step: it is not there.')
    expect(marks(frames[5], 'items')).toEqual({ 0: 'current' })
    expect(frames[5].vars).toMatchObject({ item: 3, lookups: 1 })
    expect(frames[6].say).toBe('3 is new, so add puts it in the Set.')
    expect(row(frames[6], 'seen')?.values).toEqual([3])
  })

  it('finds the repeat with a single lookup, and ends by comparing the two costs', () => {
    expect(frames[9].say).toBe('seen.has(3) looks the item up in one step: it is there, so this is a duplicate.')
    expect(marks(frames[9], 'seen')).toEqual({ 0: 'done' })
    expect(frames[10].say).toBe(
      'Found a repeat, so return true. The Set made 3 lookups; the nested loops made 2 comparisons.',
    )
    expect(frames[10].vars).toMatchObject({ comparisons: 2, lookups: 3, returned: true })
  })

  it('asks how many comparisons the nested loops will make, and how many lookups the Set will make', () => {
    const asked = frames.flatMap((f, i) => (f.ask ? [[i, f.ask] as const] : []))
    expect(asked.map(([i]) => i)).toEqual([1, 5])
    expect(asked.map(([, a]) => a.question)).toEqual([
      'How many comparisons will the nested loops make?',
      'How many lookups will the Set make?',
    ])
    expect(asked.map(([, a]) => a.options[a.answer])).toEqual(['2', '3'])
    expect(asked.map(([, a]) => a.answer)).toEqual([0, 1]) // not always the first option
    expect(asked[0][1].explain).toBe('It stops at the first equal pair, after 2 comparisons.')
    expect(asked[1][1].explain).toBe('The Set makes one lookup per item and stops at the first repeat: 3 lookups.')
  })
})

describe('duplicate check: a list with no repeat, [2, 5, 7]', () => {
  const frames = record([2, 5, 7])

  it('compares all 3 pairs, then looks up all 3 items', () => {
    expect(frames.map((f) => f.line)).toEqual([1, 4, 4, 4, 7, 10, 13, 14, 13, 14, 13, 14, 16])
    expect(frames[4].say).toBe('No pair was equal, so return false.')
    expect(frames[4].vars).toMatchObject({ comparisons: 3, returned: false })
  })

  it('ends with both costs and the Set holding every item', () => {
    const last = frames.at(-1)!
    expect(last.say).toBe('Every item was new, so return false. The Set made 3 lookups; the nested loops made 3 comparisons.')
    expect(row(last, 'seen')?.values).toEqual([2, 5, 7])
  })

  it('explains the pair count when nothing repeats', () => {
    const first = frames.find((f) => f.ask)!.ask!
    expect(first.explain).toBe('Each item is compared with every item after it: 3 items make 3 pairs.')
  })
})

describe('duplicate check: the default, six different numbers, shows the gap', () => {
  it('needs 15 comparisons for the nested loops and 6 lookups for the Set, in 31 steps', () => {
    const frames = record([4, 7, 2, 9, 5, 1])
    expect(frames).toHaveLength(31)
    expect(frames.at(-1)!.vars).toMatchObject({ comparisons: 15, lookups: 6, returned: false })
  })
})

describe('duplicate check: edge lists', () => {
  it('handles an empty list: nothing to compare and nothing to look up', () => {
    const frames = record([])
    expect(frames.map((f) => f.line)).toEqual([1, 7, 10, 16])
    expect(frames[1].say).toBe('There are no pairs to compare, so return false.')
    expect(frames.some((f) => f.ask)).toBe(false)
    expect(frames.at(-1)!.vars).toMatchObject({ comparisons: 0, lookups: 0, returned: false })
  })

  it('handles one item: no pairs, one lookup', () => {
    const frames = record([5])
    expect(frames.map((f) => f.line)).toEqual([1, 7, 10, 13, 14, 16])
    expect(frames.at(-1)!.vars).toMatchObject({ comparisons: 0, lookups: 1 })
    expect(frames.filter((f) => f.ask).map((f) => f.ask!.question)).toEqual(['How many lookups will the Set make?'])
  })

  it('handles two equal items: one comparison, two lookups', () => {
    const frames = record([8, 8])
    expect(frames.map((f) => f.line)).toEqual([1, 4, 4, 10, 13, 14, 13, 13])
    expect(frames.at(-1)!.vars).toMatchObject({ comparisons: 1, lookups: 2, returned: true })
  })

  it('does not share state between runs', () => {
    const a = record([1, 2, 1])
    record([9, 9, 9])
    expect(record([1, 2, 1])).toEqual(a)
  })
})

describe('duplicate check: both counts always agree with real code', () => {
  const lists: number[][] = Array.from({ length: 200 }, (_, i) =>
    Array.from({ length: i % 7 }, (_, j) => ((i * 7 + j * 13) % 6) - 2),
  )
  it.each(lists.map((l) => [JSON.stringify(l), l] as const))('%s', (_name, items) => {
    const frames = record(items)
    const last = frames.at(-1)!
    const slow = nestedLoops(items)
    const fast = withASet(items)
    expect(last.vars.comparisons).toBe(slow.comparisons)
    expect(last.vars.lookups).toBe(fast.lookups)
    expect(last.vars.returned).toBe(fast.result)
    expect(fast.result).toBe(slow.result)

    for (const key of ['comparisons', 'lookups'] as const) {
      const counts = frames.map((f) => f.vars[key] as number)
      counts.slice(1).forEach((count, i) => {
        expect(count - counts[i]).toBeGreaterThanOrEqual(0)
        expect(count - counts[i]).toBeLessThanOrEqual(1)
      })
    }
    for (const frame of frames) {
      for (const label of ['items', 'seen']) {
        const r = row(frame, label)
        for (const index of Object.keys(r?.marks ?? {})) expect(Number(index)).toBeLessThan(r!.values.length)
      }
    }
  })
})
