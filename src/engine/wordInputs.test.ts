import { describe, expect, it } from 'vitest'
import { wordEditor } from './wordInputs'

const editor = wordEditor({ label: 'Word', maxLength: 12 })
const parse = (text: string) => editor.parse(text)
const ok = (value: string) => ({ ok: true, value })
const bad = (message: string) => ({ ok: false, message })

/** A small deterministic random source, so the tests do not depend on luck. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

describe('wordEditor.parse: accepted input', () => {
  it.each([
    ['racecar', 'racecar'],
    ['a', 'a'],
    ['ab', 'ab'],
    ['1221', '1221'],
    ['r2d2', 'r2d2'],
    ['abcdefghijkl', 'abcdefghijkl'], // exactly the longest word
    ['  racecar  ', 'racecar'], // spaces around the word are trimmed, not refused
    ['\nracecar\t', 'racecar'],
  ])('accepts %j', (text, value) => {
    expect(parse(text)).toEqual(ok(value))
  })

  it('reads capitals as lowercase, so "Racecar" is the same word as "racecar"', () => {
    expect(parse('Racecar')).toEqual(ok('racecar'))
    expect(parse('NOON')).toEqual(ok('noon'))
    expect(parse('RaCeCaR')).toEqual(ok('racecar'))
  })

  it.each(['', '   ', '\n'])('allows an empty word (%j): it is a palindrome by definition', (text) => {
    expect(parse(text)).toEqual(ok(''))
  })
})

describe('wordEditor.parse: refused input, with a message that names the problem', () => {
  it.each([
    ['race car', bad('Letters and digits only: leave out the space.')],
    ['a b', bad('Letters and digits only: leave out the space.')],
    ['a\tb', bad('Letters and digits only: leave out the tab.')],
    ['a\nb', bad('Letters and digits only: leave out the line break.')],
    ['noon!', bad('Letters and digits only: leave out the "!".')],
    ['a,b', bad('Letters and digits only: leave out the ",".')],
    ["don't", bad('Letters and digits only: leave out the "\'".')],
    ['a-b', bad('Letters and digits only: leave out the "-".')],
    ['a_b', bad('Letters and digits only: leave out the "_".')],
    ['1.5', bad('Letters and digits only: leave out the ".".')],
    ['été', bad('Letters and digits only: "é" is outside A to Z and 0 to 9.')],
    ['😀', bad('Letters and digits only: "😀" is outside A to Z and 0 to 9.')],
  ])('refuses %j', (text, expected) => {
    expect(parse(text)).toEqual(expected)
  })

  it('names the first problem when there are several', () => {
    expect(parse('a b!')).toEqual(bad('Letters and digits only: leave out the space.'))
  })

  it('refuses a word longer than the limit and says how long it was', () => {
    expect(parse('abcdefghijklm')).toEqual(bad('Use at most 12 characters (you entered 13).'))
    expect(parse('a'.repeat(50))).toEqual(bad('Use at most 12 characters (you entered 50).'))
  })

  it('refuses a huge text before reading it', () => {
    expect(parse('a'.repeat(500))).toEqual(bad('That is too long. Use up to 12 characters.'))
  })
})

describe('wordEditor: label, hint and format', () => {
  it('shows its label and a hint that says capitals count as lowercase', () => {
    expect(editor.label).toBe('Word')
    expect(editor.hint).toBe(
      'Up to 12 letters or digits, with no spaces or punctuation. Capitals are read as lowercase.',
    )
  })

  it('writes the word as typed, so it parses back to the same word', () => {
    expect(editor.format('racecar')).toBe('racecar')
    expect(editor.format('')).toBe('')
    for (const word of ['', 'a', 'abba', 'r2d2', 'abcdefghijkl']) {
      expect(parse(editor.format(word))).toEqual(ok(word))
    }
  })

  it('round-trips whatever parse returned for capitals', () => {
    const parsed = parse('RaceCar')
    expect(parsed.ok && parse(editor.format(parsed.value))).toEqual(ok('racecar'))
  })

  it('follows the limit it was given', () => {
    const short = wordEditor({ label: 'Word', maxLength: 5 })
    expect(short.parse('abcdef')).toEqual(bad('Use at most 5 characters (you entered 6).'))
    expect(short.hint).toContain('Up to 5 letters or digits')
  })
})

describe('wordEditor.random', () => {
  it('makes short lowercase words within the limit, both palindromes and not', () => {
    const rng = seeded(7)
    let palindromes = 0
    let others = 0
    for (let i = 0; i < 200; i++) {
      const word = editor.random(rng)
      expect(word).toMatch(/^[a-z]{3,9}$/)
      expect(parse(editor.format(word))).toEqual(ok(word))
      if (word === [...word].reverse().join('')) palindromes++
      else others++
    }
    expect(palindromes).toBeGreaterThan(40)
    expect(others).toBeGreaterThan(40)
  })

  it('works with the real random source', () => {
    expect(editor.random()).toMatch(/^[a-z]+$/)
  })

  it('never exceeds a small limit', () => {
    const tiny = wordEditor({ label: 'Word', maxLength: 4 })
    for (let i = 0; i < 50; i++) expect(tiny.random(seeded(i + 1)).length).toBeLessThanOrEqual(4)
  })
})

describe('wordEditor.extremes', () => {
  const all = editor.extremes()

  it('all parse, fit the limit and round-trip through format', () => {
    for (const word of all) {
      expect(word.length).toBeLessThanOrEqual(12)
      expect(parse(editor.format(word))).toEqual(ok(word))
    }
  })

  it('has no duplicates', () => {
    expect(new Set(all).size).toBe(all.length)
  })

  it('covers the empty word, one character, two, and the longest words of both parities', () => {
    expect(all).toContain('')
    expect(all.some((w) => w.length === 1)).toBe(true)
    expect(all.some((w) => w.length === 2)).toBe(true)
    expect(all.some((w) => w.length === 12)).toBe(true)
    expect(all.some((w) => w.length === 11)).toBe(true)
  })

  it('covers palindromes, a mismatch at the first pair and a mismatch at the last (innermost) pair', () => {
    const isPalindrome = (w: string) => w === [...w].reverse().join('')
    expect(all.some((w) => w.length > 1 && isPalindrome(w))).toBe(true)
    expect(all.some((w) => w.length > 1 && w[0] !== w[w.length - 1])).toBe(true)
    // the only mismatch is the innermost pair
    expect(
      all.some((w) => {
        const mid = Math.floor(w.length / 2)
        return w.length > 3 && !isPalindrome(w) && w[mid - 1] !== w[w.length - mid] && w.slice(0, mid - 1) === [...w.slice(w.length - mid + 1)].reverse().join('')
      }),
    ).toBe(true)
  })
})
