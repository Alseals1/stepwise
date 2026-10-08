import { describe, expect, it } from 'vitest'
import type { Frame, Row } from '../../engine/types'
import { bugs, bugList } from './bugs'
import { record } from './record'

const bug = (id: string) => bugs.find((b) => b.id === id)!
const last = (frames: Frame[]) => frames[frames.length - 1]
const row = (frame: Frame, label: string): Row | undefined => frame.rows?.find((r) => r.label === label)

describe('the bug list', () => {
  it('has the three classic mistakes, each with a label and a reason', () => {
    expect(bugs.map((b) => b.id)).toEqual(['has-on-array', 'index-not-item', 'no-add'])
    for (const b of bugs) {
      expect(b.label.length).toBeGreaterThan(5)
      expect(b.why.length).toBeGreaterThan(40)
    }
    expect(new Set(bugs.map((b) => b.label)).size).toBe(3)
  })

  it('shows the broken line in each bug’s code, in both languages', () => {
    for (const language of ['js', 'ts'] as const) {
      expect(bug('has-on-array').code[language].split('\n')[3]).toContain('if (items.has(item)) return true')
      expect(bug('index-not-item').code[language].split('\n')[3]).toContain('if (i === j) return true')
      expect(bug('no-add').code[language].split('\n')[4]).toContain('seen.add(item)')
    }
  })

  it('keeps JS and TS the same length, and every frame’s line inside the code', () => {
    for (const b of bugs) {
      const lines = b.code.js.split('\n').length
      expect(b.code.ts.split('\n').length).toBe(lines)
      for (const list of [[3, 1, 3], [1, 2, 3], [], [5], [4, 4], [1, 2, 3, 4, 5, 5]]) {
        for (const frame of b.record(list)) {
          expect(frame.line).toBeGreaterThanOrEqual(1)
          expect(frame.line).toBeLessThanOrEqual(lines)
        }
      }
    }
  })

  it('never asks a predict question, and is pure', () => {
    for (const b of bugs) {
      const input = [2, 7, 2]
      const before = [...input]
      const frames = b.record(input)
      expect(frames.some((f) => f.ask)).toBe(false)
      expect(input).toEqual(before)
      expect(b.record(input)).toEqual(frames)
    }
  })
})

describe('which list a bug runs on', () => {
  it('uses the learner’s list when it has a repeat', () => {
    expect(bugList([5, 2, 9, 2])).toEqual({ items: [5, 2, 9, 2], substituted: false })
  })

  it('uses [3, 1, 3] when it has no repeat, or is empty', () => {
    expect(bugList([4, 7, 2, 9, 5, 1])).toEqual({ items: [3, 1, 3], substituted: true })
    expect(bugList([])).toEqual({ items: [3, 1, 3], substituted: true })
    expect(bugList([8])).toEqual({ items: [3, 1, 3], substituted: true })
  })

  it('says so in the first step when it swaps the list, and otherwise just names the call', () => {
    for (const b of bugs) {
      expect(b.record([4, 7, 2])[0].say).toBe('A list with a repeat shows the bug: [3, 1, 3].')
      expect(b.record([5, 2, 9, 2])[0].say).toBe('Call hasDuplicate with [5, 2, 9, 2], a list with a repeat.')
    }
  })

  it('the correct version really does return true on the list the bugs use', () => {
    for (const list of [[3, 1, 3], [5, 2, 9, 2]]) {
      const frames = record(bugList(list).items)
      expect(last(frames).vars.returned).toBe(true)
    }
  })
})

describe('bug 1: .has on the array', () => {
  const frames = bug('has-on-array').record([4, 7, 2])

  it('stops with a TypeError on the first lookup, described and not thrown', () => {
    expect(frames.map((f) => f.line)).toEqual([1, 2, 3, 4])
    expect(last(frames).say).toBe(
      'TypeError: items.has is not a function. An array has no has method, so the run stops here and never returns anything.',
    )
    expect(last(frames).vars.error).toBe('TypeError: items.has is not a function')
    expect(last(frames).vars.returned).toBeUndefined()
  })

  it('crashes the same way on any list', () => {
    expect(last(bug('has-on-array').record([5, 5])).vars.error).toBe('TypeError: items.has is not a function')
  })

  it('explains the mistake', () => {
    expect(bug('has-on-array').why).toMatch(/array has no has/i)
    expect(bug('has-on-array').why).toMatch(/seen\.has\(item\)/)
  })
})

describe('bug 2: i instead of items[i]', () => {
  const frames = bug('index-not-item').record([3, 1, 3])

  it('compares positions, never matches, and returns false for a list with a repeat', () => {
    expect(frames.map((f) => f.line)).toEqual([1, 4, 4, 4, 7])
    expect(frames[1].say).toBe('Compare i = 0 with j = 1: they are different positions, so 0 === 1 is false.')
    expect(frames[2].say).toBe('Compare i = 0 with j = 2: they are different positions, so 0 === 2 is false.')
    expect(frames[3].say).toBe('Compare i = 1 with j = 2: they are different positions, so 1 === 2 is false.')
    expect(frames[1].vars).toMatchObject({ i: 0, j: 1 })
    expect(row(frames[1], 'items')?.marks).toEqual({ 0: 'current', 1: 'compare' })
    expect(last(frames).vars.returned).toBe(false)
    expect(last(frames).say).toBe('No pair matched, so return false. But 3 appears twice, so the right answer is true.')
  })

  it('makes every pair for a longer list, always ending false', () => {
    const longer = bug('index-not-item').record([1, 2, 3, 4, 5, 1])
    expect(longer).toHaveLength(1 + 15 + 1)
    expect(last(longer).vars.returned).toBe(false)
  })
})

describe('bug 3: never calling add', () => {
  const frames = bug('no-add').record([3, 1, 3])

  it('looks every item up in a Set that never fills, and returns false', () => {
    expect(frames.map((f) => f.line)).toEqual([1, 2, 4, 5, 4, 5, 4, 5, 7])
    expect(frames[2].say).toBe('seen.has(3) looks in the Set: it is empty, so the item is not there.')
    expect(frames[3].say).toBe('Nothing adds 3 to the Set, so seen is still empty.')
    for (const frame of frames.slice(1)) expect(row(frame, 'seen')?.values).toEqual([])
    expect(last(frames).vars.returned).toBe(false)
    expect(last(frames).say).toBe(
      'Every lookup missed because the Set stayed empty, so return false. But 3 appears twice, so the right answer is true.',
    )
  })

  it('the third lookup of 3 misses even though 3 was already seen', () => {
    expect(frames[6].say).toBe('seen.has(3) looks in the Set: it is empty, so the item is not there.')
    expect(frames[6].vars).toMatchObject({ item: 3, lookups: 3 })
  })
})
