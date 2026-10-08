import { describe, expect, it } from 'vitest'
import { buildChoices } from './choices'

describe('buildChoices', () => {
  it('returns the right answer among the options and says where it is', () => {
    const { options, answer } = buildChoices(6, [2, 4], 0)
    expect(options).toHaveLength(3)
    expect(options[answer]).toBe('6')
  })

  it('puts the right answer in a rotating position', () => {
    const positions = [0, 1, 2, 3, 4, 5].map((n) => buildChoices(6, [2, 4], n).answer)
    expect(positions).toEqual([0, 1, 2, 0, 1, 2])
  })

  it('never repeats an option, even when wrong answers collide with the right one or each other', () => {
    const { options, answer } = buildChoices(2, [2, 0, 0, 2], 1)
    expect(new Set(options).size).toBe(options.length)
    expect(options[answer]).toBe('2')
    expect(options).toContain('0')
  })

  it('tops up with nearby numbers when there are too few wrong answers', () => {
    const { options, answer } = buildChoices(5, [5], 0)
    expect(options).toHaveLength(3)
    expect(new Set(options).size).toBe(3)
    expect(options[answer]).toBe('5')
  })

  it('can offer four options', () => {
    expect(buildChoices(10, [1, 2, 3, 4], 0, 4).options).toHaveLength(4)
  })

  it('handles zero and negative numbers', () => {
    const { options, answer } = buildChoices(0, [], 2)
    expect(options).toHaveLength(3)
    expect(new Set(options).size).toBe(3)
    expect(options[answer]).toBe('0')
    expect(buildChoices(-3, [3], 1).options[buildChoices(-3, [3], 1).answer]).toBe('-3')
  })

  it('is the same every time for the same inputs, so a run is repeatable', () => {
    expect(buildChoices(12, [6, 3], 1)).toEqual(buildChoices(12, [6, 3], 1))
  })
})
