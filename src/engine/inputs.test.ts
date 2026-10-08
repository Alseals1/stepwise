import { describe, expect, it } from 'vitest'
import { numberListEditor } from './inputs'

const editor = numberListEditor({ label: 'Numbers', maxLength: 8, min: -99, max: 99 })
const parse = (text: string) => editor.parse(text)
const ok = (...value: number[]) => ({ ok: true, value })
const bad = (message: string) => ({ ok: false, message })

describe('numberListEditor.parse: accepted input', () => {
  it.each([
    ['2, 4, 6', [2, 4, 6]],
    ['2 4 6', [2, 4, 6]],
    ['2,4,6', [2, 4, 6]],
    ['2;4;6', [2, 4, 6]],
    ['  2 ,  4 ;6   ', [2, 4, 6]],
    ['2,,4,, 6,', [2, 4, 6]],
    ['\n2\n4\t6\n', [2, 4, 6]],
    ['-3, 0, 7', [-3, 0, 7]],
    ['−3, 5', [-3, 5]], // a typographic minus sign
    ['007, -012', [7, -12]], // leading zeros
    ['-0', [0]], // never a negative zero
    ['99, -99', [99, -99]], // both limits are allowed
    ['5', [5]],
    ['1 1 1 1', [1, 1, 1, 1]], // repeats are fine
  ])('accepts %j', (text, value) => {
    expect(parse(text)).toEqual(ok(...value))
  })

  it('accepts exactly the maximum count', () => {
    expect(parse('1 2 3 4 5 6 7 8')).toEqual(ok(1, 2, 3, 4, 5, 6, 7, 8))
  })

  it.each(['', '   ', ' , ; '])('treats %j as an empty list', (text) => {
    expect(parse(text)).toEqual(ok())
  })

  it('never gives back a negative zero', () => {
    const result = parse('-0')
    expect(result.ok && Object.is(result.value[0], -0)).toBe(false)
  })
})

describe('numberListEditor.parse: rejected input, with a message that names the problem', () => {
  it.each([
    ['abc', bad('"abc" isn’t a number.')],
    ['1, two, 3', bad('"two" isn’t a number.')],
    ['2.5', bad('"2.5" isn’t a whole number.')],
    ['1, 3.0', bad('"3.0" isn’t a whole number.')],
    ['.5', bad('".5" isn’t a whole number.')],
    ['1e3', bad('"1e3" isn’t a whole number.')],
    ['+5', bad('Leave out the plus sign in "+5".')],
    ['--5', bad('"--5" isn’t a number.')],
    ['5-', bad('"5-" isn’t a number.')],
    ['1_000', bad('"1_000" isn’t a number.')],
    ['NaN', bad('"NaN" isn’t a number.')],
    ['Infinity', bad('"Infinity" isn’t a number.')],
    ['0x10', bad('"0x10" isn’t a number.')],
  ])('rejects %j', (text, expected) => {
    expect(parse(text)).toEqual(expected)
  })

  it('rejects more numbers than allowed, saying how many were entered', () => {
    expect(parse('1 2 3 4 5 6 7 8 9')).toEqual(bad('Use at most 8 numbers (you entered 9).'))
  })

  it.each([
    ['100', bad('Numbers must be between -99 and 99 (found 100).')],
    ['-100', bad('Numbers must be between -99 and 99 (found -100).')],
    ['5, 150, 7', bad('Numbers must be between -99 and 99 (found 150).')],
    ['99999999999999999999', bad('Numbers must be between -99 and 99 (found 100000000000000000000).')],
  ])('rejects %j as out of range', (text, expected) => {
    expect(parse(text)).toEqual(expected)
  })

  it('reports the first problem only, in this order: not a number, then too many, then out of range', () => {
    expect(parse('500 abc')).toEqual(bad('"abc" isn’t a number.'))
    expect(parse('500 1 2 3 4 5 6 7 8')).toEqual(bad('Use at most 8 numbers (you entered 9).'))
    expect(parse('500 -500')).toEqual(bad('Numbers must be between -99 and 99 (found 500).'))
  })

  it('rejects absurdly long input without trying to read it', () => {
    expect(parse('1 '.repeat(500))).toEqual(bad('That is too long. Use up to 8 short numbers.'))
  })
})

describe('numberListEditor with a minimum length', () => {
  const needsTwo = numberListEditor({ label: 'Numbers', maxLength: 8, min: 0, max: 9, minLength: 2 })
  it('asks for more numbers when there are too few', () => {
    expect(needsTwo.parse('5')).toEqual(bad('Enter at least 2 numbers.'))
    expect(needsTwo.parse('')).toEqual(bad('Enter at least 2 numbers.'))
    expect(needsTwo.parse('5 6')).toEqual(ok(5, 6))
  })

  it('uses the singular for a minimum of one', () => {
    const needsOne = numberListEditor({ label: 'N', maxLength: 8, min: 0, max: 9, minLength: 1 })
    expect(needsOne.parse('')).toEqual(bad('Enter at least 1 number.'))
  })

  it('says so in the hint', () => {
    expect(needsTwo.hint).toBe('Between 2 and 8 whole numbers from 0 to 9, separated by commas or spaces.')
  })
})

describe('numberListEditor: hint, format and random', () => {
  it('describes the limits in the hint and keeps the label', () => {
    expect(editor.label).toBe('Numbers')
    expect(editor.hint).toBe('Up to 8 whole numbers from -99 to 99, separated by commas or spaces.')
  })

  it('formats a list the way it is typed, and the result parses back', () => {
    expect(editor.format([2, 4, 6])).toBe('2, 4, 6')
    expect(editor.format([])).toBe('')
    expect(editor.format([-3, 0, 99])).toBe('-3, 0, 99')
    expect(parse(editor.format([-3, 0, 99]))).toEqual(ok(-3, 0, 99))
  })

  it('makes a random list that is always valid, readable in length and within the limits', () => {
    for (let seed = 0; seed < 200; seed++) {
      let state = seed + 1
      const rng = () => {
        state = (state * 16807) % 2147483647
        return state / 2147483647
      }
      const list = editor.random(rng)
      expect(list.length).toBeGreaterThanOrEqual(3)
      expect(list.length).toBeLessThanOrEqual(6)
      for (const n of list) {
        expect(Number.isInteger(n)).toBe(true)
        expect(n).toBeGreaterThanOrEqual(1)
        expect(n).toBeLessThanOrEqual(9)
      }
      expect(parse(editor.format(list))).toEqual(ok(...list))
    }
  })

  it('covers the whole range of lengths and values over many tries', () => {
    const lengths = new Set<number>()
    const values = new Set<number>()
    for (let i = 0; i < 400; i++) {
      const list = editor.random()
      lengths.add(list.length)
      list.forEach((n) => values.add(n))
    }
    expect([...lengths].sort()).toEqual([3, 4, 5, 6])
    expect(values.size).toBe(9)
  })

  it('stays inside tighter limits', () => {
    const tight = numberListEditor({ label: 'N', maxLength: 4, min: 5, max: 6 })
    for (let i = 0; i < 100; i++) {
      const list = tight.random()
      expect(list.length).toBeLessThanOrEqual(4)
      list.forEach((n) => expect([5, 6]).toContain(n))
    }
  })
})

describe('numberListEditor.extremes', () => {
  const lists = (options: Parameters<typeof numberListEditor>[0]) => numberListEditor(options).extremes()

  it('offers the boundary cases of the editor\u2019s own limits, all of which it accepts', () => {
    for (const options of [
      { label: 'N', maxLength: 8, min: -99, max: 99 },
      { label: 'N', maxLength: 6, min: -99, max: 99 },
      { label: 'N', maxLength: 4, min: 0, max: 9, minLength: 2 },
      { label: 'N', maxLength: 1, min: 5, max: 5, minLength: 1 },
    ]) {
      const editor = numberListEditor(options)
      for (const list of editor.extremes()) {
        expect(editor.parse(editor.format(list)), `${JSON.stringify(options)} -> [${list}]`).toEqual({ ok: true, value: list })
      }
    }
  })

  it('includes the longest lists of the biggest and smallest numbers', () => {
    const all = lists({ label: 'N', maxLength: 6, min: -99, max: 99 })
    expect(all).toContainEqual(Array(6).fill(99))
    expect(all).toContainEqual(Array(6).fill(-99))
  })

  it('includes an empty list only when the editor allows one', () => {
    expect(lists({ label: 'N', maxLength: 6, min: 0, max: 9 })).toContainEqual([])
    const needsOne = lists({ label: 'N', maxLength: 6, min: 0, max: 9, minLength: 1 })
    expect(needsOne).not.toContainEqual([])
    expect(needsOne.every((l) => l.length >= 1)).toBe(true)
  })

  it('includes a single number, zeros and equal numbers where the limits allow', () => {
    const all = lists({ label: 'N', maxLength: 6, min: -99, max: 99 })
    expect(all).toContainEqual([0])
    expect(all).toContainEqual([0, 0, 0])
    expect(all).toContainEqual([7, 7])
  })

  it('has no duplicates', () => {
    const all = lists({ label: 'N', maxLength: 6, min: -99, max: 99 }).map((l) => JSON.stringify(l))
    expect(new Set(all).size).toBe(all.length)
  })
})
