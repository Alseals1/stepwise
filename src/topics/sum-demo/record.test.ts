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

describe('sumDemo predictions', () => {
  const frames = sumDemo.record([2, 4, 6])
  const asked = frames.filter((f) => f.ask)

  it('asks "what happens next?" before each addition and before the return', () => {
    expect(asked.map((f) => f.line)).toEqual([4, 4, 4, 6])
    expect(frames[0].ask).toBeUndefined()
  })

  it('asks about the total after adding, with the right answer among the options', () => {
    const first = asked[0].ask!
    expect(first.question).toBe('What will total be after adding 2?')
    expect(first.options[first.answer]).toBe('2')
    expect(first.options).toContain('0') // the mistake of forgetting to add
    const second = asked[1].ask!
    expect(second.options[second.answer]).toBe('6')
    expect(second.explain).toBe('total was 2 and 4 is added, so it becomes 6.')
  })

  it('asks what the function returns', () => {
    const last = asked[3].ask!
    expect(last.question).toBe('What will sum return?')
    expect(last.options[last.answer]).toBe('12')
  })

  it('puts the right answer in different positions', () => {
    expect(asked.map((f) => f.ask!.answer)).toEqual([0, 1, 2, 0])
  })

  it('still asks sensible questions for an empty list', () => {
    const empty = sumDemo.record([]).filter((f) => f.ask)
    expect(empty).toHaveLength(1)
    const ask = empty[0].ask!
    expect(ask.options[ask.answer]).toBe('0')
    expect(new Set(ask.options).size).toBe(ask.options.length)
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
