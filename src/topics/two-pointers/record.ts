import type { Ask, Frame, Mark, Pointer } from '../../engine/types'

export interface TwoPointersInput {
  /** Sorted, smallest first. */
  nums: number[]
  target: number
}

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`
/** Negative numbers get brackets inside a sum, so "(-5) + 2" reads correctly. */
const operand = (n: number) => (n < 0 ? `(${n})` : String(n))

const LEFT_MOVES = 'left moves right'
const RIGHT_MOVES = 'right moves left'
const MATCH = 'it is a match'

/**
 * Two Sum II on a sorted list: a pointer at each end, and every round either finds the pair or drops
 * one number for good. Counts the sums, which is at most n - 1.
 */
export function record({ nums, target }: TwoPointersInput): Frame[] {
  const frames: Frame[] = []
  const n = nums.length
  let asked = 0

  // The three possible answers to "what happens next?", with the right one in a rotating position.
  const ask = (sum: number, left: number, right: number, correct: string, explain: string): Ask => {
    const others = [LEFT_MOVES, RIGHT_MOVES, MATCH].filter((option) => option !== correct)
    const answer = asked++ % 3
    const options = [...others]
    options.splice(answer, 0, correct)
    return {
      question: `${nums[left]} + ${nums[right]} = ${sum} and the target is ${target}. What happens next?`,
      options,
      answer,
      explain,
    }
  }

  const pointersAt = (left: number | null, right: number | null): Pointer[] => {
    const all: Pointer[] = []
    if (left !== null) all.push({ label: 'left', index: left })
    if (right !== null) all.push({ label: 'right', index: right })
    return all.filter((pointer) => pointer.index >= 0 && pointer.index < n)
  }

  // Numbers outside left..right have been ruled out for good.
  const marksFor = (left: number, right: number, pair?: Mark): Record<number, Mark> => {
    const marks: Record<number, Mark> = {}
    for (let i = 0; i < n; i++) if (i < left || i > right) marks[i] = 'dim'
    if (left <= right && left < n) {
      marks[left] = pair ?? 'current'
      if (right !== left) marks[right] = pair ?? 'compare'
    }
    return marks
  }

  function snapshot(
    line: number,
    say: string,
    shown: { pointers: Pointer[]; marks: Record<number, Mark> },
    vars: Frame['vars'] = {},
    question?: Ask,
  ) {
    frames.push({ line, vars: { nums, target, ...vars }, say, array: nums, ...shown, ask: question })
  }

  const list = `[${nums.join(', ')}]`
  snapshot(
    1,
    `Call twoSumSorted with ${list} and target ${target}. The list is sorted, so we can start from both ends.`,
    { pointers: [], marks: {} },
  )

  let left = 0
  snapshot(
    2,
    n === 0 ? 'left starts at 0, but the list is empty.' : 'left starts at 0, on the smallest number.',
    { pointers: pointersAt(left, null), marks: n > 0 ? { 0: 'current' } : {} },
    { left },
  )
  let right = n - 1
  snapshot(
    3,
    n === 0
      ? 'right starts at -1, before the start of the empty list.'
      : `right starts at ${right}, on the biggest number.`,
    { pointers: pointersAt(left, right), marks: n > 0 ? marksFor(left, right) : {} },
    { left, right },
  )

  let sums = 0
  let sum: number | undefined
  while (left < right) {
    sums++
    sum = nums[left] + nums[right]
    snapshot(
      5,
      `Add the two ends: ${operand(nums[left])} + ${operand(nums[right])} = ${sum}. The target is ${target}.`,
      { pointers: pointersAt(left, right), marks: marksFor(left, right) },
      { left, right, sum, sums },
    )

    if (sum === target) {
      snapshot(
        6,
        `${operand(nums[left])} + ${operand(nums[right])} = ${target}, a match, so return [${left}, ${right}]. That took ${plural(sums, 'sum')}; nested loops could have needed up to ${plural((n * (n - 1)) / 2, 'pair')}.`,
        { pointers: pointersAt(left, right), marks: marksFor(left, right, 'done') },
        { left, right, sum, sums, result: [left, right] },
        ask(sum, left, right, MATCH, `The two ends add up to the target exactly, so they are the pair.`),
      )
      return frames
    }

    if (sum < target) {
      const dropped = nums[left]
      const question = ask(
        sum,
        left,
        right,
        LEFT_MOVES,
        `The sum is too small, so the left number (${dropped}) is too small even with the biggest partner left: left moves right.`,
      )
      left++
      snapshot(
        7,
        `${sum} is less than ${target}, so ${dropped} is too small for every number still in play: drop it and move left one step right.`,
        { pointers: pointersAt(left, right), marks: marksFor(left, right) },
        { left, right, sum, sums },
        question,
      )
    } else {
      const dropped = nums[right]
      const question = ask(
        sum,
        left,
        right,
        RIGHT_MOVES,
        `The sum is too big, so the right number (${dropped}) is too big even with the smallest partner left: right moves left.`,
      )
      right--
      snapshot(
        8,
        `${sum} is more than ${target}, so ${dropped} is too big for every number still in play: drop it and move right one step left.`,
        { pointers: pointersAt(left, right), marks: marksFor(left, right) },
        { left, right, sum, sums },
        question,
      )
    }
  }

  const finalVars: Frame['vars'] = { left, right, sums, result: [] }
  if (sum !== undefined) finalVars.sum = sum
  snapshot(
    10,
    n >= 2
      ? `left and right have met, so every number is ruled out and no pair adds up to ${target}: return [].`
      : `A pair needs two numbers, and the list has ${n === 0 ? 'none' : 'only one'}: return [].`,
    { pointers: n >= 2 ? pointersAt(left, right) : pointersAt(left, n > 0 ? right : null), marks: marksFor(n, n) },
    finalVars,
  )
  return frames
}
