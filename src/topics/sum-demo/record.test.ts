import { describe, expect, it } from 'vitest'
import { sumDemo } from './index'

describe('sumDemo.record', () => {
  const frames = sumDemo.record([2, 4, 6])

  it('starts at the function header and ends on the return line', () => {
    expect(frames[0].line).toBe(1)
    expect(frames.at(-1)?.line).toBe(6)
  })

  it('records 2 setup frames, 2 per number, and 1 return frame', () => {
    expect(frames).toHaveLength(2 + 2 * 3 + 1)
  })

  it('tracks total and the current number as it goes', () => {
    const adds = frames.filter((f) => f.line === 4)
    expect(adds.map((f) => f.vars.total)).toEqual([2, 6, 12])
    expect(adds.map((f) => f.vars.n)).toEqual([2, 4, 6])
  })

  it('marks the number being added as current and earlier ones as done', () => {
    const secondAdd = frames.filter((f) => f.line === 4)[1]
    expect(secondAdd.marks).toEqual({ 0: 'done', 1: 'current' })
  })

  it('handles an empty array', () => {
    const empty = sumDemo.record([])
    expect(empty.map((f) => f.line)).toEqual([1, 2, 6])
    expect(empty.at(-1)?.vars.total).toBe(0)
  })
})

describe('topic contract', () => {
  it('has JS and TS code with the same number of lines', () => {
    expect(sumDemo.code.ts.split('\n')).toHaveLength(sumDemo.code.js.split('\n').length)
  })

  it('only uses line numbers that exist in the code', () => {
    const lineCount = sumDemo.code.js.split('\n').length
    for (const frame of sumDemo.record(sumDemo.defaultInput)) {
      expect(frame.line).toBeGreaterThanOrEqual(1)
      expect(frame.line).toBeLessThanOrEqual(lineCount)
    }
  })
})
