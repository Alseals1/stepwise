import { buildChoices } from '../../engine/choices'
import type { Ask, Frame, Mark, Row } from '../../engine/types'

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`
const list = (values: number[]) => `[${values.join(', ')}]`
/** Negative numbers get brackets inside a sum or product, so "(-5) + 2" reads correctly. */
const operand = (n: number) => (n < 0 ? `(${n})` : String(n))

/** The condition filter and find use in the code, `n > 5`. */
const isBig = (n: number) => n > 5

/** Wrong counts to offer next to the right one: whole numbers from 0 up, nearest first. */
function countsNear(correct: number, max: number): number[] {
  const near: number[] = []
  for (let value = 0; value <= max; value++) if (value !== correct) near.push(value)
  near.sort((a, b) => Math.abs(a - correct) - Math.abs(b - correct))
  return [...near, max + 1, max + 2]
}

/**
 * Four array methods, one after the other, on the same list: map, filter, reduce and find. Each step
 * is one call of the small callback function, and `nums` never changes.
 */
export function record(nums: number[]): Frame[] {
  const frames: Frame[] = []
  const results: Record<string, number | number[] | undefined> = {}
  let asked = 0

  const ask = (question: string, correct: number, wrong: number[], explain: string): Ask => {
    const { options, answer } = buildChoices(correct, wrong, asked++)
    return { question, options, answer, explain }
  }

  function snapshot(
    line: number,
    say: string,
    shown: { marks: Record<number, Mark>; result?: Row },
    extra: { vars?: Frame['vars']; question?: Ask } = {},
  ) {
    const rows: Row[] = [{ label: 'nums', values: nums, marks: shown.marks }]
    if (shown.result) rows.push(shown.result)
    frames.push({ line, vars: { nums, ...results, ...extra.vars }, say, rows, ask: extra.question })
  }

  const empty = (method: string) => `${method} has nothing to visit, so it returns an empty list.`
  // Marks for the items already visited, after each one's outcome is known.
  const visited = (upTo: number, outcome: (index: number) => Mark): Record<number, Mark> =>
    Object.fromEntries(Array.from({ length: upTo }, (_, i) => [i, outcome(i)]))

  snapshot(1, `Call demo with ${list(nums)}. We will try four methods on this one list.`, { marks: {} })

  // ---- map ----
  const doubled: number[] = []
  const mapCount = nums.length
  for (let k = 0; k < nums.length; k++) {
    const n = nums[k]
    doubled.push(n * 2)
    snapshot(
      2,
      `The callback gets n = ${n} and returns ${operand(n)} * 2 = ${n * 2}, which goes into the new list.`,
      {
        marks: { ...visited(k, () => 'done'), [k]: 'current' },
        result: { label: 'doubled', values: [...doubled], marks: { [k]: 'current' } },
      },
      {
        vars: { n, doubled: [...doubled] },
        question:
          k === 0
            ? ask(
                'How many items will the new list have?',
                mapCount,
                countsNear(mapCount, mapCount + 1),
                `map makes one new item for every old item, so the new list has ${plural(mapCount, 'item')}, the same as the old one.`,
              )
            : undefined,
      },
    )
  }
  results.doubled = [...doubled]
  snapshot(
    2,
    nums.length === 0
      ? empty('map')
      : `map is done: ${list(nums)} became ${list(doubled)}. nums itself is unchanged.`,
    { marks: visited(nums.length, () => 'done'), result: { label: 'doubled', values: [...doubled], marks: {} } },
  )

  // ---- filter ----
  const kept: number[] = []
  const keptTotal = nums.filter(isBig).length
  const dropped = new Set<number>()
  for (let k = 0; k < nums.length; k++) {
    const n = nums[k]
    const keep = isBig(n)
    if (keep) kept.push(n)
    else dropped.add(k)
    snapshot(
      3,
      `The callback gets n = ${n}: ${n} > 5 is ${keep}, so ${n} is ${keep ? 'kept' : 'left out'}.`,
      {
        marks: { ...visited(k, (i) => (dropped.has(i) ? 'dim' : 'done')), [k]: 'current' },
        result: { label: 'big', values: [...kept], marks: keep ? { [kept.length - 1]: 'current' } : {} },
      },
      {
        vars: { n, big: [...kept] },
        question:
          k === 0
            ? ask(
                'How many items will filter keep?',
                keptTotal,
                countsNear(keptTotal, nums.length),
                `filter keeps the items where n > 5 is true, here ${plural(keptTotal, 'item')}. Unlike map, its new list can be shorter.`,
              )
            : undefined,
      },
    )
  }
  results.big = [...kept]
  snapshot(
    3,
    nums.length === 0 ? empty('filter') : `filter is done: it kept ${plural(kept.length, 'item')}, ${list(kept)}.`,
    {
      marks: visited(nums.length, (i) => (dropped.has(i) ? 'dim' : 'done')),
      result: { label: 'big', values: [...kept], marks: {} },
    },
  )

  // ---- reduce ----
  const finalTotal = nums.reduce((sum, n) => sum + n, 0)
  let sum = 0
  snapshot(
    4,
    'reduce starts with 0 as the total, then the callback runs once per item.',
    { marks: {}, result: { label: 'total', values: [0], marks: {} } },
    { vars: { sum } },
  )
  for (let k = 0; k < nums.length; k++) {
    const n = nums[k]
    const next = sum + n
    snapshot(
      4,
      `sum is ${sum} and n is ${n}, so the callback returns ${operand(sum)} + ${operand(n)} = ${next}, the new sum.`,
      {
        marks: { ...visited(k, () => 'done'), [k]: 'current' },
        result: { label: 'total', values: [next], marks: { 0: 'current' } },
      },
      {
        vars: { sum, n },
        question:
          k === 0
            ? ask(
                'What will the final total be?',
                finalTotal,
                [finalTotal - nums[nums.length - 1], finalTotal + nums[0], finalTotal - nums[0]],
                `The callback adds each item to the running sum, starting from 0, so the total is ${finalTotal}.`,
              )
            : undefined,
      },
    )
    sum = next
  }
  results.total = sum
  snapshot(
    4,
    nums.length === 0
      ? 'There are no items, so reduce returns its starting value, 0.'
      : `reduce is done: the total is ${sum}.`,
    { marks: visited(nums.length, () => 'done'), result: { label: 'total', values: [sum], marks: {} } },
  )

  // ---- find ----
  const matchAt = nums.findIndex(isBig)
  const findChecks = matchAt === -1 ? nums.length : matchAt + 1
  for (let k = 0; k < findChecks; k++) {
    const n = nums[k]
    const match = isBig(n)
    const unseen = nums.length - k - 1
    if (match) results.first = n
    snapshot(
      5,
      match
        ? `The callback gets n = ${n}: ${n} > 5 is true, so find returns ${n} and stops.${
            unseen > 0 ? ` The last ${unseen === 1 ? 'item is' : `${unseen} items are`} never looked at.` : ''
          }`
        : `The callback gets n = ${n}: ${n} > 5 is false, so find keeps looking.`,
      {
        marks: { ...visited(k, () => 'dim'), [k]: match ? 'done' : 'current' },
        result: match ? { label: 'first', values: [n], marks: {} } : undefined,
      },
      {
        vars: { n },
        question:
          k === 0
            ? ask(
                'How many items will find check before it stops?',
                findChecks,
                countsNear(findChecks, nums.length),
                matchAt === -1
                  ? `No item matches, so find checks all ${plural(nums.length, 'item')} before giving up.`
                  : `find stops at the first item where n > 5 is true, after checking ${plural(findChecks, 'item')}.`,
              )
            : undefined,
      },
    )
  }
  if (matchAt === -1) {
    results.first = undefined
    snapshot(
      5,
      nums.length === 0
        ? 'There are no items, so find returns undefined.'
        : 'No item made the callback return true, so find returns undefined.',
      { marks: visited(nums.length, () => 'dim') },
    )
  }

  snapshot(
    6,
    nums.length === 0
      ? 'The list was empty, so every callback ran zero times and nothing was built.'
      : `Same list, four results. map, filter and reduce visited all ${plural(nums.length, 'item')}; find ${
          matchAt === -1 ? `checked all ${nums.length} and found nothing` : `stopped after ${findChecks}`
        }.`,
    { marks: {} },
  )
  return frames
}
