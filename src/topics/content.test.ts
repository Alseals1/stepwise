import { describe, expect, it } from 'vitest'
import type { Frame } from '../engine/types'
import { entries } from './registry'
import { stages } from './stages'

describe('stages', () => {
  it('have unique ids that work in a hash URL', () => {
    const ids = stages.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })

  it('list which topics are built, in order, with the rest still planned', () => {
    expect(stages.map((s) => [s.id, s.available])).toEqual([
      ['sum-demo', true],
      ['array-basics', true],
      ['map-filter-reduce', true],
      ['hidden-loops', true],
      ['has-duplicate', true],
      ['two-pointers', false],
      ['binary-search', false],
      ['hash-map-two-sum', false],
    ])
  })

  it('have a title, a blurb and a difficulty from 1 to 3', () => {
    for (const s of stages) {
      expect(s.title.length).toBeGreaterThan(0)
      expect(s.blurb.length).toBeGreaterThan(0)
      expect([1, 2, 3]).toContain(s.difficulty)
    }
  })

  it('have a built topic for every available stage and no topic without a stage', () => {
    const available = stages.filter((s) => s.available).map((s) => s.id)
    expect(entries.map((e) => e.id).sort()).toEqual([...available].sort())
  })
})

/** Rules every "what happens next?" question must follow. */
function expectFairAsks(frames: Frame[]) {
  expect(frames[0].ask, 'there is nothing to predict before the first step').toBeUndefined()
  const asks = frames.flatMap((f) => (f.ask ? [f.ask] : []))
  for (const ask of asks) {
    expect(ask.question.length).toBeGreaterThan(0)
    expect(ask.options.length).toBeGreaterThanOrEqual(2)
    expect(ask.options.length).toBeLessThanOrEqual(4)
    expect(new Set(ask.options).size, `"${ask.question}" repeats an option`).toBe(ask.options.length)
    expect(Number.isInteger(ask.answer)).toBe(true)
    expect(ask.answer).toBeGreaterThanOrEqual(0)
    expect(ask.answer).toBeLessThan(ask.options.length)
    expect(ask.explain.length).toBeGreaterThan(0)
    const lengths = ask.options.map((o) => o.length)
    expect(Math.max(...lengths) - Math.min(...lengths), `"${ask.question}" options differ in length`).toBeLessThanOrEqual(4)
  }
  if (asks.length >= 2) expect(new Set(asks.map((a) => a.answer)).size).toBeGreaterThan(1)
}

describe.each(entries)('topic content: $id', ({ content, frames, code, editor }) => {
  it('has the text every topic page shows', () => {
    expect(content.whatItDoes).toMatch(/\.$/)
    expect(content.analogy.text.length).toBeGreaterThan(20)
    expect(content.analogy.breaks.length).toBeGreaterThan(20)
    expect(content.source.url).toMatch(/^https:\/\//)
    expect(content.source.label.length).toBeGreaterThan(0)
  })

  it('only links a watch-first video when it has a real https URL', () => {
    if (content.watchFirst) {
      expect(content.watchFirst.url).toMatch(/^https:\/\//)
      expect(content.watchFirst.label.length).toBeGreaterThan(0)
    }
  })

  it('states time and space complexity with reasons', () => {
    expect(content.bigO.time).toMatch(/^O\(.+\)$/)
    expect(content.bigO.space).toMatch(/^O\(.+\)$/)
    expect(content.bigO.timeBecause.length).toBeGreaterThan(10)
    expect(content.bigO.spaceBecause.length).toBeGreaterThan(10)
  })

  it('has a quiz with valid answers and options of about the same length', () => {
    expect(content.quiz.length).toBeGreaterThanOrEqual(3)
    for (const q of content.quiz) {
      expect(q.question.length).toBeGreaterThan(0)
      expect(q.options.length).toBeGreaterThanOrEqual(3)
      expect(q.options.length).toBeLessThanOrEqual(4)
      expect(new Set(q.options).size).toBe(q.options.length)
      expect(Number.isInteger(q.answer)).toBe(true)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(q.options.length)
      expect(q.explain.length).toBeGreaterThan(0)
      const lengths = q.options.map((o) => o.length)
      expect(
        Math.max(...lengths) - Math.min(...lengths),
        `"${q.question}" options differ in length: the longest or shortest gives the answer away`,
      ).toBeLessThanOrEqual(4)
    }
  })

  it('puts the right answer in different positions, so guessing "always A" does not work', () => {
    expect(new Set(content.quiz.map((q) => q.answer)).size).toBeGreaterThan(1)
  })

  it('has predictions that are fair: valid answers, unique options of similar length, varied positions', () => {
    expectFairAsks(frames)
  })

  describe('custom input', () => {
    it.skipIf(!editor)('starts from an example that parses back to the default run', () => {
      const again = editor!.apply(editor!.example.text)
      expect(again.ok && again.run.frames).toEqual(frames)
    })

    it.skipIf(!editor)('records a correct, fair run for extreme inputs', () => {
      const lineCount = code.js.split('\n').length
      for (const text of editor!.extremes) {
        const result = editor!.apply(text)
        expect(result.ok, `"${text}" should be accepted`).toBe(true)
        if (!result.ok) continue
        expect(result.run.frames.length, `"${text}"`).toBeGreaterThan(0)
        for (const frame of result.run.frames) {
          expect(frame.line, `"${text}": line number`).toBeGreaterThanOrEqual(1)
          expect(frame.line, `"${text}": line number`).toBeLessThanOrEqual(lineCount)
        }
        expectFairAsks(result.run.frames)
      }
    })

    it.skipIf(!editor)('records a correct, fair run for many random inputs', () => {
      for (let i = 0; i < 60; i++) {
        const { frames: runFrames } = editor!.random()
        expect(runFrames.length).toBeGreaterThan(0)
        expectFairAsks(runFrames)
      }
    })
  })

  it('has frames that fit the code', () => {
    expect(frames.length).toBeGreaterThan(0)
    expect(code.ts.split('\n')).toHaveLength(code.js.split('\n').length)
  })
})
