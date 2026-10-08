import type { Bug, Frame, Mark, Row } from '../../engine/types'

/** A list that has a repeat, used when the learner's own list has none. */
const FALLBACK = [3, 1, 3]

const firstRepeat = (items: number[]) => items.find((item, index) => items.indexOf(item) !== index)

/**
 * The list a bug runs on. Two of the bugs answer `false`, which is also right for a list without a
 * repeat, so a bug run needs a list that has one: the learner's if it does, otherwise [3, 1, 3].
 */
export function bugList(items: number[]): { items: number[]; substituted: boolean } {
  return firstRepeat(items) === undefined
    ? { items: [...FALLBACK], substituted: true }
    : { items: [...items], substituted: false }
}

const openingSentence = (items: number[], substituted: boolean) =>
  substituted
    ? `A list with a repeat shows the bug: [${items.join(', ')}].`
    : `Call hasDuplicate with [${items.join(', ')}], a list with a repeat.`

const itemsRow = (items: number[], marks: Record<number, Mark> = {}): Row => ({ label: 'items', values: items, marks })

// ---- Bug 1: .has on the array ----

const hasOnArrayCode = {
  js: `function hasDuplicate(items) {
  const seen = new Set()
  for (const item of items) {
    if (items.has(item)) return true
    seen.add(item)
  }
  return false
}`,
  ts: `function hasDuplicate(items: number[]): boolean {
  const seen = new Set<number>()
  for (const item of items) {
    if (items.has(item)) return true
    seen.add(item)
  }
  return false
}`,
}

const CRASH = 'TypeError: items.has is not a function'

function recordHasOnArray(input: number[]): Frame[] {
  const { items, substituted } = bugList(input)
  const seen: Row = { label: 'seen', values: [], marks: {} }
  return [
    { line: 1, vars: { items }, say: openingSentence(items, substituted), rows: [itemsRow(items)] },
    { line: 2, vars: { items, seen: [] }, say: 'Create an empty Set called seen.', rows: [itemsRow(items), seen] },
    {
      line: 3,
      vars: { items, seen: [], item: items[0] },
      say: `The loop takes the first item, ${items[0]}.`,
      rows: [itemsRow(items, { 0: 'current' }), seen],
    },
    {
      line: 4,
      vars: { items, seen: [], item: items[0], error: CRASH },
      say: `${CRASH}. An array has no has method, so the run stops here and never returns anything.`,
      rows: [itemsRow(items, { 0: 'current' }), seen],
    },
  ]
}

// ---- Bug 2: i instead of items[i] ----

const indexNotItemCode = {
  js: `function hasDuplicate(items) {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (i === j) return true
    }
  }
  return false
}`,
  ts: `function hasDuplicate(items: number[]): boolean {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (i === j) return true
    }
  }
  return false
}`,
}

function recordIndexNotItem(input: number[]): Frame[] {
  const { items, substituted } = bugList(input)
  const frames: Frame[] = [
    { line: 1, vars: { items }, say: openingSentence(items, substituted), rows: [itemsRow(items)] },
  ]
  let comparisons = 0
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      comparisons++
      frames.push({
        line: 4,
        vars: { items, comparisons, i, j },
        say: `Compare i = ${i} with j = ${j}: they are different positions, so ${i} === ${j} is false.`,
        rows: [itemsRow(items, { [i]: 'current', [j]: 'compare' })],
      })
    }
  }
  frames.push({
    line: 7,
    vars: { items, comparisons, returned: false },
    say: `No pair matched, so return false. But ${firstRepeat(items)} appears twice, so the right answer is true.`,
    rows: [itemsRow(items)],
  })
  return frames
}

// ---- Bug 3: never calling add ----

const noAddCode = {
  js: `function hasDuplicate(items) {
  const seen = new Set()
  for (const item of items) {
    if (seen.has(item)) return true
    // seen.add(item) is missing here
  }
  return false
}`,
  ts: `function hasDuplicate(items: number[]): boolean {
  const seen = new Set<number>()
  for (const item of items) {
    if (seen.has(item)) return true
    // seen.add(item) is missing here
  }
  return false
}`,
}

function recordNoAdd(input: number[]): Frame[] {
  const { items, substituted } = bugList(input)
  const seen: Row = { label: 'seen', values: [], marks: {} }
  const frames: Frame[] = [
    { line: 1, vars: { items }, say: openingSentence(items, substituted), rows: [itemsRow(items)] },
    { line: 2, vars: { items, seen: [] }, say: 'Create an empty Set called seen.', rows: [itemsRow(items), seen] },
  ]
  items.forEach((item, k) => {
    const vars = { items, seen: [], item, lookups: k + 1 }
    frames.push(
      {
        line: 4,
        vars,
        say: `seen.has(${item}) looks in the Set: it is empty, so the item is not there.`,
        rows: [itemsRow(items, { [k]: 'current' }), seen],
      },
      {
        line: 5,
        vars,
        say: `Nothing adds ${item} to the Set, so seen is still empty.`,
        rows: [itemsRow(items, { [k]: 'current' }), seen],
      },
    )
  })
  frames.push({
    line: 7,
    vars: { items, seen: [], lookups: items.length, returned: false },
    say: `Every lookup missed because the Set stayed empty, so return false. But ${firstRepeat(items)} appears twice, so the right answer is true.`,
    rows: [itemsRow(items), seen],
  })
  return frames
}

/** The three classic mistakes, replayed on a list with a repeat so each one gives the wrong answer. */
export const bugs: Bug<number[]>[] = [
  {
    id: 'has-on-array',
    label: '.has on the array',
    code: hasOnArrayCode,
    record: recordHasOnArray,
    why: 'An array has no has method (that belongs to a Set), so JavaScript throws a TypeError the first time it reaches that line. The fix is seen.has(item).',
  },
  {
    id: 'index-not-item',
    label: 'i instead of items[i]',
    code: indexNotItemCode,
    record: recordIndexNotItem,
    why: 'j always starts at i + 1, so i === j can never be true: the code compares positions, not values. The fix is items[i] === items[j].',
  },
  {
    id: 'no-add',
    label: 'Never calling add',
    code: noAddCode,
    record: recordNoAdd,
    why: 'Without seen.add(item) the Set never holds anything, so every lookup misses and the answer is always false. The fix is to add each new item after its lookup.',
  },
]
