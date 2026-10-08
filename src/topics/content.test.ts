import { describe, expect, it } from 'vitest'
import { entries } from './registry'
import { stages } from './stages'

describe('stages', () => {
  it('have unique ids that work in a hash URL', () => {
    const ids = stages.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })

  it('start with the built warm-up and list the 7 planned v1 topics after it', () => {
    expect(stages[0]).toMatchObject({ id: 'sum-demo', available: true })
    expect(stages.slice(1).every((s) => !s.available)).toBe(true)
    expect(stages).toHaveLength(8)
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

describe.each(entries)('topic content: $id', ({ content, frames, code }) => {
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

  it('has frames that fit the code', () => {
    expect(frames.length).toBeGreaterThan(0)
    expect(code.ts.split('\n')).toHaveLength(code.js.split('\n').length)
  })
})
