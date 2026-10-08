import { describe, expect, it } from 'vitest'
import { code } from './code'
import { palindrome } from './index'

describe('palindrome topic', () => {
  it('has the same id as its stage on the map', () => {
    expect(palindrome.id).toBe('palindrome')
  })

  it('starts on "racecar": an odd word with a middle character and a clean true', () => {
    expect(palindrome.defaultInput).toBe('racecar')
    expect(palindrome.defaultInput.length % 2).toBe(1)
    const frames = palindrome.record(palindrome.defaultInput)
    expect(frames).toHaveLength(11)
    expect(frames.at(-1)?.vars.result).toBe(true)
  })

  it('keeps the JS and TS code on the same 12 lines, and every frame line inside them', () => {
    expect(code.js.split('\n')).toHaveLength(12)
    expect(code.ts.split('\n')).toHaveLength(12)
    for (const frame of palindrome.record('abcdeba')) expect(frame.line).toBeLessThanOrEqual(12)
  })

  it('lets the learner type a word of up to 12 letters or digits, capitals as lowercase', () => {
    const editor = palindrome.inputEditor!
    expect(editor.label).toBe('Word')
    expect(editor.parse('Level')).toEqual({ ok: true, value: 'level' })
    expect(editor.parse('abcdefghijklm')).toEqual({ ok: false, message: 'Use at most 12 characters (you entered 13).' })
    expect(editor.format(palindrome.defaultInput)).toBe('racecar')
  })
})
