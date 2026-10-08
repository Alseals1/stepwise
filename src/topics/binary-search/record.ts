import type { Ask, Frame, Mark, Pointer } from '../../engine/types'

export interface BinarySearchInput {
  /** Sorted, smallest first. */
  nums: number[]
  target: number
}

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

const LEFT_HALF = 'search the left half'
const RIGHT_HALF = 'search the right half'
const MATCH = 'stop, it is a match'

/** low, mid and high can all land on one box. */
const POINTER_SLOTS = 3

/**
 * Iterative binary search on a sorted list. Every round looks at the middle of low..high and either
 * finds the target or throws away the half it cannot be in, so the search space at least halves.
 */
export function record({ nums, target }: BinarySearchInput): Frame[] {
  const frames: Frame[] = []
  const n = nums.length
  let asked = 0

  // The three possible answers to "what happens next?", with the right one in a rotating position.
  const ask = (middle: number, correct: string, explain: string): Ask => {
    const options = [LEFT_HALF, RIGHT_HALF, MATCH].filter((option) => option !== correct)
    const answer = asked++ % 3
    options.splice(answer, 0, correct)
    return {
      question: `The middle is ${middle} and the target is ${target}. What happens next?`,
      options,
      answer,
      explain,
    }
  }

  const pointersAt = (spots: { low?: number; mid?: number; high?: number }): Pointer[] => {
    const all: Pointer[] = []
    if (spots.low !== undefined) all.push({ label: 'low', index: spots.low })
    if (spots.mid !== undefined) all.push({ label: 'mid', index: spots.mid })
    if (spots.high !== undefined) all.push({ label: 'high', index: spots.high })
    return all.filter((pointer) => pointer.index >= 0 && pointer.index < n)
  }

  // Numbers outside low..high have been ruled out for good.
  const marksFor = (low: number, high: number, mid?: number, mark: Mark = 'current'): Record<number, Mark> => {
    const marks: Record<number, Mark> = {}
    for (let i = 0; i < n; i++) if (i < low || i > high) marks[i] = 'dim'
    if (mid !== undefined && mid >= 0 && mid < n) marks[mid] = mark
    return marks
  }

  function snapshot(
    line: number,
    say: string,
    shown: { pointers: Pointer[]; marks: Record<number, Mark> },
    vars: Frame['vars'] = {},
    question?: Ask,
  ) {
    frames.push({
      line,
      vars: { nums, target, ...vars },
      say,
      array: nums,
      ...shown,
      pointerSlots: POINTER_SLOTS,
      ask: question,
    })
  }

  const scan = (found: number) => (found === -1 ? n : found + 1)
  const saved = (probes: number, scanned: number) =>
    `That took ${plural(probes, 'probe')}; scanning from the left would have needed ${plural(scanned, 'comparison')}.`

  snapshot(
    1,
    `Call binarySearch with [${nums.join(', ')}] and target ${target}. The list is sorted, so each look can rule out half of it.`,
    { pointers: [], marks: {} },
  )

  let low = 0
  snapshot(
    2,
    n === 0 ? 'low starts at 0, but the list is empty.' : 'low starts at 0, the first position.',
    { pointers: pointersAt({ low }), marks: {} },
    { low },
  )
  let high = n - 1
  snapshot(
    3,
    n === 0
      ? 'high starts at -1, before the start of the empty list.'
      : `high starts at ${high}, the last position.`,
    { pointers: pointersAt({ low, high }), marks: {} },
    { low, high },
  )

  let probes = 0
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    probes++
    snapshot(
      5,
      `Probe ${probes}: the middle of positions ${low} to ${high} is position ${mid}, which holds ${nums[mid]}.`,
      { pointers: pointersAt({ low, mid, high }), marks: marksFor(low, high, mid) },
      { low, high, mid, probes },
    )

    if (nums[mid] === target) {
      snapshot(
        6,
        `${nums[mid]} is the target, so return ${mid}. ${saved(probes, scan(mid))}`,
        { pointers: pointersAt({ low, mid, high }), marks: marksFor(low, high, mid, 'done') },
        { low, high, mid, probes, result: mid },
        ask(nums[mid], MATCH, 'The middle number is the target, so the search is over.'),
      )
      return frames
    }

    if (nums[mid] < target) {
      const question = ask(
        nums[mid],
        RIGHT_HALF,
        `The middle (${nums[mid]}) is less than the target, and the list is sorted, so the target can only be to the right.`,
      )
      const dropped = nums[mid]
      low = mid + 1
      snapshot(
        7,
        `${dropped} is less than ${target}, so ${target} can only be to the right: drop the left half and set low to ${low} (${plural(high - low + 1, 'number')} left).`,
        { pointers: pointersAt({ low, high }), marks: marksFor(low, high) },
        { low, high, mid, probes },
        question,
      )
    } else {
      const question = ask(
        nums[mid],
        LEFT_HALF,
        `The middle (${nums[mid]}) is more than the target, and the list is sorted, so the target can only be to the left.`,
      )
      const dropped = nums[mid]
      high = mid - 1
      snapshot(
        8,
        `${dropped} is more than ${target}, so ${target} can only be to the left: drop the right half and set high to ${high} (${plural(high - low + 1, 'number')} left).`,
        { pointers: pointersAt({ low, high }), marks: marksFor(low, high) },
        { low, high, mid, probes },
        question,
      )
    }
  }

  snapshot(
    10,
    n === 0
      ? 'The list is empty, so there is nothing to search: return -1 without a single probe.'
      : `low (${low}) has passed high (${high}), so nothing is left to search: return -1. ${saved(probes, scan(-1))}`,
    { pointers: pointersAt({ low, high }), marks: marksFor(low, high) },
    { low, high, probes, result: -1 },
  )
  return frames
}
