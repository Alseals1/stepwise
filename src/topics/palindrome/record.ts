import { buildChoices } from '../../engine/choices'
import type { Ask, Frame, Mark, Pointer } from '../../engine/types'

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

const KEEP_GOING = 'Keep going'
const RETURN_FALSE = 'Return false'
const RETURN_TRUE = 'Return true'

/**
 * isPalindrome with two pointers: front and back walk inward, and each round compares one pair.
 * The first pair that differs returns false at once. Counts the comparisons, at most half the characters.
 */
export function record(str: string): Frame[] {
  const frames: Frame[] = []
  const chars = str.split('')
  const n = chars.length
  let asked = 0

  const pointersAt = (front: number, back: number | null): Pointer[] => {
    const all: Pointer[] = [{ label: 'front', index: front }]
    if (back !== null) all.push({ label: 'back', index: back })
    return all.filter((pointer) => pointer.index >= 0 && pointer.index < n)
  }

  /** Characters outside front..back have been settled; the pair in play is highlighted. */
  const marksFor = (front: number, back: number, pair?: Mark): Record<number, Mark> => {
    const marks: Record<number, Mark> = {}
    for (let i = 0; i < n; i++) if (i < front || i > back) marks[i] = 'done'
    if (front <= back && front < n) {
      marks[front] = pair ?? 'current'
      if (back !== front) marks[back] = pair ?? 'compare'
    }
    return marks
  }

  const allDone = (): Record<number, Mark> => Object.fromEntries(chars.map((_, i) => [i, 'done' as const]))

  function snapshot(
    line: number,
    say: string,
    pointers: Pointer[],
    marks: Record<number, Mark>,
    vars: Frame['vars'] = {},
    ask?: Ask,
  ) {
    frames.push({ line, vars: { str, ...vars }, say, array: chars, pointers, pointerSlots: 2, marks, ask })
  }

  /** "What happens next?" after a compare: three fixed options, the right one in a rotating place. */
  function decisionAsk(a: string, b: string, correct: string, explain: string): Ask {
    const options = [KEEP_GOING, RETURN_FALSE, RETURN_TRUE].filter((option) => option !== correct)
    options.splice(asked++ % 3, 0, correct)
    return {
      question: `front is "${a}" and back is "${b}". What happens next?`,
      options,
      answer: options.indexOf(correct),
      explain,
    }
  }

  // The number of comparisons this word needs, worked out first so the first question can be asked.
  let total = 0
  for (let f = 0, b = n - 1; f < b; f++, b--) {
    total++
    if (chars[f] !== chars[b]) break
  }
  const countAsk = (): Ask => {
    const { options, answer } = buildChoices(total, [n, Math.ceil(n / 2), Math.floor(n / 2)], asked++)
    return {
      question: `How many comparisons will "${str}" need before it can answer?`,
      options,
      answer,
      explain:
        total === Math.floor(n / 2) && chars.join('') === [...chars].reverse().join('')
          ? `Every pair matches, so it checks all ${plural(total, 'pair')}: half the characters, rounded down.`
          : `It stops at the first pair that differs, after ${plural(total, 'comparison')}.`,
    }
  }

  snapshot(
    1,
    n === 0
      ? 'Call isPalindrome with "". The word is empty, so there is nothing to compare.'
      : `Call isPalindrome with "${str}". We will compare characters from both ends.`,
    [],
    {},
  )

  let front = 0
  snapshot(
    2,
    n === 0 ? 'front starts at 0, but the word is empty.' : 'front starts at 0, on the first character.',
    pointersAt(front, null),
    n > 0 ? { 0: 'current' } : {},
    { front },
  )
  let back = n - 1
  snapshot(
    3,
    n === 0 ? 'back starts at -1, before the start of the empty word.' : `back starts at ${back}, on the last character.`,
    pointersAt(front, back),
    n > 0 ? marksFor(front, back) : {},
    { front, back },
  )

  let comparisons = 0
  while (front < back) {
    comparisons++
    const a = chars[front]
    const b = chars[back]
    snapshot(
      5,
      `Compare "${a}" at front with "${b}" at back: a palindrome needs the two ends to be equal.`,
      pointersAt(front, back),
      marksFor(front, back),
      { front, back, comparisons },
      comparisons === 1 ? countAsk() : undefined,
    )

    if (a !== b) {
      const between = back - front - 1
      const unseen = between > 0 ? `, and the ${plural(between, 'character')} in between ${between === 1 ? 'was' : 'were'} never looked at` : ''
      snapshot(
        6,
        `"${a}" and "${b}" are different, so the word is not a palindrome: return false at once. That took ${plural(comparisons, 'comparison')}${unseen}.`,
        pointersAt(front, back),
        marksFor(front, back, 'mismatch'),
        { front, back, comparisons, result: false },
        decisionAsk(a, b, RETURN_FALSE, `"${a}" and "${b}" are different, so the word cannot be a palindrome: return false straight away.`),
      )
      return frames
    }

    const question = decisionAsk(
      a,
      b,
      KEEP_GOING,
      `"${a}" and "${b}" are equal, so this pair is fine: keep going with the next pair inside it.`,
    )
    front++
    back--
    snapshot(
      8,
      `"${a}" and "${b}" match, so this pair is settled: move front one step right and back one step left.`,
      pointersAt(front, back),
      marksFor(front, back),
      { front, back, comparisons },
      question,
    )
  }

  // The loop has ended: front reached back (an odd word's middle character), or passed it.
  let ending: string
  if (n === 0) ending = 'front (0) is not less than back (-1), so the loop never runs.'
  else if (front === back) {
    ending = `front and back are both on "${chars[front]}", the middle character: it has no partner to compare with, so the loop stops.`
  } else ending = `front (${front}) has gone past back (${back}): every pair has been compared, so the loop stops.`
  snapshot(4, ending, pointersAt(front, n > 0 ? back : null), allDone(), { front, back, comparisons })

  snapshot(
    11,
    n === 0
      ? 'An empty word reads the same both ways: return true.'
      : n === 1
        ? 'A single character reads the same both ways: return true.'
        : `The pointers met in the middle, so every pair matched: return true. That took ${plural(comparisons, 'comparison')} for ${n} characters.`,
    pointersAt(front, n > 0 ? back : null),
    allDone(),
    { front, back, comparisons, result: true },
  )
  return frames
}
