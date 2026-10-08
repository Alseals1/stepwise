import { describe, expect, it } from 'vitest'
import type { Frame } from '../../engine/types'
import { record } from './record'

const asks = (frames: Frame[]) => frames.flatMap((f) => (f.ask ? [f.ask] : []))
const lines = (frames: Frame[]) => frames.map((f) => f.line)
const last = (frames: Frame[]) => frames[frames.length - 1]
const marked = (frame: Frame, mark: string) =>
  Object.entries(frame.marks ?? {})
    .filter(([, m]) => m === mark)
    .map(([i]) => Number(i))

/** What real code does: the two-pointer loop, counting comparisons. */
function reference(str: string) {
  let front = 0
  let back = str.length - 1
  let comparisons = 0
  while (front < back) {
    comparisons++
    if (str[front] !== str[back]) return { result: false, comparisons }
    front++
    back--
  }
  return { result: true, comparisons }
}

/** A small deterministic random source, so the tests do not depend on luck. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function generatedWords(count: number): string[] {
  const rng = seeded(42)
  const words: string[] = ['', 'a', 'aa', 'ab', 'aba', 'abba', 'racecar', 'abcdefgedcba']
  for (let i = 0; i < count; i++) {
    const length = Math.floor(rng() * 13) // 0 to 12
    const alphabet = rng() < 0.5 ? 'ab' : 'abcdefgh01'
    const letters = Array.from({ length }, () => alphabet[Math.floor(rng() * alphabet.length)])
    if (rng() < 0.4) {
      // make it a palindrome, sometimes with one letter broken afterwards
      for (let j = 0; j < Math.floor(length / 2); j++) letters[length - 1 - j] = letters[j]
      if (length > 1 && rng() < 0.3) letters[Math.floor(rng() * length)] = 'z'
    }
    words.push(letters.join(''))
  }
  return words
}

describe('palindrome: the default word "racecar"', () => {
  const frames = record('racecar')

  it('sets the pointers up, then makes a compare and a decision each round, then ends the loop', () => {
    expect(lines(frames)).toEqual([1, 2, 3, 5, 8, 5, 8, 5, 8, 4, 11])
  })

  it('starts by calling isPalindrome with the word', () => {
    expect(frames[0].say).toBe('Call isPalindrome with "racecar". We will compare characters from both ends.')
    expect(frames[0].array).toEqual(['r', 'a', 'c', 'e', 'c', 'a', 'r'])
    expect(frames[0].pointers).toEqual([])
    expect(frames[0].marks).toEqual({})
    expect(frames[0].vars).toEqual({ str: 'racecar' })
  })

  it('puts front on the first character and back on the last', () => {
    expect(frames[1].say).toBe('front starts at 0, on the first character.')
    expect(frames[1].pointers).toEqual([{ label: 'front', index: 0 }])
    expect(frames[1].vars).toEqual({ str: 'racecar', front: 0 })
    expect(frames[2].say).toBe('back starts at 6, on the last character.')
    expect(frames[2].pointers).toEqual([
      { label: 'front', index: 0 },
      { label: 'back', index: 6 },
    ])
    expect(frames[2].vars).toEqual({ str: 'racecar', front: 0, back: 6 })
  })

  it('compares the two ends and counts the comparison', () => {
    expect(frames[3].say).toBe('Compare "r" at front with "r" at back: a palindrome needs the two ends to be equal.')
    expect(frames[3].marks).toEqual({ 0: 'current', 6: 'compare' })
    expect(frames[3].vars).toEqual({ str: 'racecar', front: 0, back: 6, comparisons: 1 })
  })

  it('a match settles the pair and moves both pointers inward', () => {
    expect(frames[4].say).toBe(
      '"r" and "r" match, so this pair is settled: move front one step right and back one step left.',
    )
    expect(frames[4].pointers).toEqual([
      { label: 'front', index: 1 },
      { label: 'back', index: 5 },
    ])
    expect(frames[4].marks).toEqual({ 0: 'done', 6: 'done', 1: 'current', 5: 'compare' })
    expect(frames[4].vars).toEqual({ str: 'racecar', front: 1, back: 5, comparisons: 1 })
  })

  it('counts three comparisons for the three pairs', () => {
    expect(frames[7].vars).toMatchObject({ front: 2, back: 4, comparisons: 3 })
    expect(frames[7].say).toBe('Compare "c" at front with "c" at back: a palindrome needs the two ends to be equal.')
  })

  it('lands both pointers on the middle character, which nobody compares', () => {
    expect(frames[8].pointers).toEqual([
      { label: 'front', index: 3 },
      { label: 'back', index: 3 },
    ])
    expect(frames[8].marks).toEqual({ 0: 'done', 1: 'done', 2: 'done', 4: 'done', 5: 'done', 6: 'done', 3: 'current' })
    expect(frames[9].say).toBe(
      'front and back are both on "e", the middle character: it has no partner to compare with, so the loop stops.',
    )
    expect(frames[9].vars).toEqual({ str: 'racecar', front: 3, back: 3, comparisons: 3 })
    expect(frames[9].marks).toEqual({ 0: 'done', 1: 'done', 2: 'done', 3: 'done', 4: 'done', 5: 'done', 6: 'done' })
  })

  it('ends by saying every pair matched and how many comparisons it took', () => {
    expect(last(frames).say).toBe(
      'The pointers met in the middle, so every pair matched: return true. That took 3 comparisons for 7 characters.',
    )
    expect(last(frames).vars).toEqual({ str: 'racecar', front: 3, back: 3, comparisons: 3, result: true })
    expect(Object.values(last(frames).marks ?? {})).toEqual(Array(7).fill('done'))
  })

  it('asks how many comparisons first, then what happens after each compare', () => {
    expect(frames[0].ask).toBeUndefined()
    const all = asks(frames)
    expect(all).toHaveLength(4)
    expect(frames[3].ask?.question).toBe('How many comparisons will "racecar" need before it can answer?')
    const count = frames[3].ask!
    expect(count.options[count.answer]).toBe('3')
    expect(frames[4].ask?.question).toBe('front is "r" and back is "r". What happens next?')
    for (const i of [4, 6, 8]) {
      const ask = frames[i].ask!
      expect(ask.options[ask.answer]).toBe('Keep going')
      expect([...ask.options].sort()).toEqual(['Keep going', 'Return false', 'Return true'])
    }
  })
})

describe('palindrome: even length, odd length and tiny words', () => {
  it('"abba" ends with the pointers crossed and no middle character', () => {
    const frames = record('abba')
    expect(lines(frames)).toEqual([1, 2, 3, 5, 8, 5, 8, 4, 11])
    expect(frames[7].say).toBe(
      'front (2) has gone past back (1): every pair has been compared, so the loop stops.',
    )
    expect(frames[7].pointers).toEqual([
      { label: 'front', index: 2 },
      { label: 'back', index: 1 },
    ])
    expect(frames[7].vars).toMatchObject({ front: 2, back: 1, comparisons: 2 })
    expect(last(frames).say).toBe(
      'The pointers met in the middle, so every pair matched: return true. That took 2 comparisons for 4 characters.',
    )
    expect(last(frames).vars).toMatchObject({ result: true })
  })

  it('a one-character word never enters the loop: it is a palindrome', () => {
    const frames = record('a')
    expect(lines(frames)).toEqual([1, 2, 3, 4, 11])
    expect(frames[2].pointers).toEqual([
      { label: 'front', index: 0 },
      { label: 'back', index: 0 },
    ])
    expect(frames[3].say).toBe(
      'front and back are both on "a", the middle character: it has no partner to compare with, so the loop stops.',
    )
    expect(last(frames).say).toBe('A single character reads the same both ways: return true.')
    expect(last(frames).vars).toEqual({ str: 'a', front: 0, back: 0, comparisons: 0, result: true })
    expect(asks(frames)).toEqual([])
  })

  it('an empty word is a palindrome by definition, and the loop never runs', () => {
    const frames = record('')
    expect(lines(frames)).toEqual([1, 2, 3, 4, 11])
    expect(frames[0].say).toBe('Call isPalindrome with "". The word is empty, so there is nothing to compare.')
    expect(frames[0].array).toEqual([])
    expect(frames[1].say).toBe('front starts at 0, but the word is empty.')
    expect(frames[2].say).toBe('back starts at -1, before the start of the empty word.')
    expect(frames[2].pointers).toEqual([])
    expect(frames[3].say).toBe('front (0) is not less than back (-1), so the loop never runs.')
    expect(last(frames).say).toBe('An empty word reads the same both ways: return true.')
    expect(last(frames).vars).toEqual({ str: '', front: 0, back: -1, comparisons: 0, result: true })
    expect(asks(frames)).toEqual([])
  })

  it('digits work like letters', () => {
    expect(last(record('12321')).vars).toMatchObject({ result: true, comparisons: 2 })
    expect(last(record('1231')).vars).toMatchObject({ result: false, comparisons: 2 })
  })
})

describe('palindrome: a mismatch stops the check early', () => {
  it('"abca": the second pair differs, so it returns false without a loop-end step', () => {
    const frames = record('abca')
    expect(lines(frames)).toEqual([1, 2, 3, 5, 8, 5, 6])
    expect(frames[5].say).toBe('Compare "b" at front with "c" at back: a palindrome needs the two ends to be equal.')
    expect(last(frames).say).toBe(
      '"b" and "c" are different, so the word is not a palindrome: return false at once. That took 2 comparisons.',
    )
    expect(last(frames).vars).toEqual({ str: 'abca', front: 1, back: 2, comparisons: 2, result: false })
    expect(marked(last(frames), 'mismatch')).toEqual([1, 2])
    expect(marked(last(frames), 'done')).toEqual([0, 3])
    expect(last(frames).pointers).toEqual([
      { label: 'front', index: 1 },
      { label: 'back', index: 2 },
    ])
  })

  it('a mismatch at the very first pair ends after one comparison and names the characters never looked at', () => {
    const frames = record('abcdefg')
    expect(lines(frames)).toEqual([1, 2, 3, 5, 6])
    expect(last(frames).say).toBe(
      '"a" and "g" are different, so the word is not a palindrome: return false at once. That took 1 comparison, and the 5 characters in between were never looked at.',
    )
    expect(marked(last(frames), 'mismatch')).toEqual([0, 6])
    expect(marked(last(frames), 'done')).toEqual([])
    expect(last(frames).vars).toMatchObject({ comparisons: 1, result: false })
  })

  it('a mismatch at the last pair needs every comparison, but still returns false', () => {
    const frames = record('abcdeba') // pairs a/a, b/b match; c/e is the innermost
    expect(last(frames).line).toBe(6)
    expect(last(frames).vars).toMatchObject({ front: 2, back: 4, comparisons: 3, result: false })
    expect(marked(last(frames), 'mismatch')).toEqual([2, 4])
    expect(marked(last(frames), 'done')).toEqual([0, 1, 5, 6])
  })

  it('says "was" for one character in between and nothing for none', () => {
    expect(last(record('abcdeba')).say).toBe(
      '"c" and "e" are different, so the word is not a palindrome: return false at once. That took 3 comparisons, and the 1 character in between was never looked at.',
    )
    expect(last(record('ab')).say).toBe(
      '"a" and "b" are different, so the word is not a palindrome: return false at once. That took 1 comparison.',
    )
  })

  it('is shorter than the run on a palindrome of the same length', () => {
    expect(record('abcdefg').length).toBeLessThan(record('abcdcba').length)
  })

  it('never has a step after the mismatch', () => {
    for (const word of ['ab', 'abc', 'abcda', 'abcdefgedcba']) {
      const frames = record(word)
      const mismatches = frames.filter((f) => marked(f, 'mismatch').length > 0)
      expect(mismatches).toHaveLength(1)
      expect(last(frames)).toBe(mismatches[0])
    }
  })

  it('asks "Return false" for the decision that finds the mismatch', () => {
    const frames = record('abca')
    const ask = last(frames).ask!
    expect(ask.question).toBe('front is "b" and back is "c". What happens next?')
    expect(ask.options[ask.answer]).toBe('Return false')
    expect(ask.explain).toBe('"b" and "c" are different, so the word cannot be a palindrome: return false straight away.')
  })
})

describe('palindrome: checked against a plain isPalindrome over many words', () => {
  const words = generatedWords(300)

  it('gives the same answer and the same number of comparisons as the real loop', () => {
    for (const word of words) {
      const frames = record(word)
      const expected = reference(word)
      expect(last(frames).vars.result, `"${word}" result`).toBe(expected.result)
      expect(last(frames).vars.comparisons, `"${word}" comparisons`).toBe(expected.comparisons)
      const compareFrames = frames.filter((f) => f.line === 5)
      expect(compareFrames, `"${word}" compare steps`).toHaveLength(expected.comparisons)
    }
  })

  it('never takes more than half the characters in comparisons', () => {
    for (const word of words) {
      expect(last(record(word)).vars.comparisons as number, `"${word}"`).toBeLessThanOrEqual(Math.floor(word.length / 2))
    }
  })

  it('keeps the pointers in range, the word unchanged, and a frame line inside the code', () => {
    for (const word of words) {
      const chars = word.split('')
      for (const frame of record(word)) {
        expect(frame.array, `"${word}"`).toEqual(chars)
        expect(frame.vars.str).toBe(word)
        expect(frame.line).toBeGreaterThanOrEqual(1)
        expect(frame.line).toBeLessThanOrEqual(12)
        expect(frame.pointers).toBeDefined()
        for (const pointer of frame.pointers ?? []) {
          expect(['front', 'back']).toContain(pointer.label)
          expect(pointer.index).toBeGreaterThanOrEqual(0)
          expect(pointer.index).toBeLessThan(word.length)
        }
        for (const index of Object.keys(frame.marks ?? {})) expect(Number(index)).toBeLessThan(word.length)
        expect(frame.pointerSlots).toBe(2)
      }
    }
  })

  it('marks as done exactly the characters outside the pointers after each match', () => {
    for (const word of words) {
      for (const frame of record(word)) {
        if (frame.line !== 8) continue
        const front = frame.vars.front as number
        const back = frame.vars.back as number
        const expected = Array.from({ length: word.length }, (_, i) => i).filter((i) => i < front || i > back)
        expect(marked(frame, 'done'), `"${word}"`).toEqual(expected)
      }
    }
  })

  it('moves front right and back left by exactly one each time it matches', () => {
    for (const word of words) {
      const frames = record(word)
      for (let i = 1; i < frames.length; i++) {
        if (frames[i].line !== 8) continue
        expect(frames[i].vars.front).toBe((frames[i - 1].vars.front as number) + 1)
        expect(frames[i].vars.back).toBe((frames[i - 1].vars.back as number) - 1)
      }
    }
  })

  it('has one say per frame, one sentence long, and no ask on the first frame', () => {
    for (const word of words) {
      const frames = record(word)
      expect(frames[0].ask).toBeUndefined()
      for (const frame of frames) {
        expect(frame.say.length).toBeGreaterThan(0)
        expect(frame.say).toMatch(/[.]$/)
      }
    }
  })

  it('asks a question about every compared word, with the right answer in the options', () => {
    for (const word of words) {
      const frames = record(word)
      const all = asks(frames)
      if (word.length < 2) {
        expect(all).toEqual([])
        continue
      }
      const compares = last(frames).vars.comparisons as number
      expect(all.length).toBe(1 + compares)
      const count = all[0]
      expect(count.options[count.answer], `"${word}"`).toBe(String(compares))
      for (const ask of all) expect(ask.options[ask.answer]).toBeDefined()
    }
  })
})
