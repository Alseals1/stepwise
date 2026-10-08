import { buildChoices } from '../../engine/choices'
import type { Ask, Frame, Mark, Row } from '../../engine/types'

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

/**
 * The same question, "does this list have a duplicate?", answered two ways on the same list: nested
 * loops that compare every pair, then a Set with one lookup per item. Both costs are counted.
 */
export function record(items: number[]): Frame[] {
  const frames: Frame[] = []
  const list = `[${items.join(', ')}]`
  let comparisons = 0
  let lookups = 0
  let returned: boolean | undefined
  let asked = 0

  // What each part will cost (they stop at the first duplicate, like the real code).
  let pairsToFirstMatch = 0
  let nestedFound = false
  outer: for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairsToFirstMatch++
      if (items[i] === items[j]) {
        nestedFound = true
        break outer
      }
    }
  }
  const firstRepeat = items.findIndex((item, index) => items.indexOf(item) !== index)
  const setFound = firstRepeat !== -1
  const lookupsTotal = setFound ? firstRepeat + 1 : items.length

  const ask = (question: string, correct: number, wrong: number[], explain: string): Ask => {
    const { options, answer } = buildChoices(correct, wrong, asked++)
    return { question, options, answer, explain }
  }

  function snapshot(
    line: number,
    say: string,
    shown: { items: Record<number, Mark>; seen?: { values: number[]; marks?: Record<number, Mark> } },
    extra: { vars?: Record<string, number>; question?: Ask } = {},
  ) {
    const vars: Frame['vars'] = { items, comparisons, lookups, ...extra.vars }
    if (shown.seen) vars.seen = [...shown.seen.values]
    if (returned !== undefined) vars.returned = returned
    const rows: Row[] = [{ label: 'items', values: items, marks: shown.items }]
    if (shown.seen) rows.push({ label: 'seen', values: [...shown.seen.values], marks: shown.seen.marks })
    frames.push({ line, vars, say, rows, ask: extra.question })
  }

  // ---- Part 1: nested loops ----
  snapshot(1, `Call hasDuplicateSlow with ${list}.`, { items: {} })
  let matched = false
  for (let i = 0; i < items.length && !matched; i++) {
    for (let j = i + 1; j < items.length; j++) {
      comparisons++
      const equal = items[i] === items[j]
      snapshot(
        4,
        `Compare items[${i}] = ${items[i]} with items[${j}] = ${items[j]}: ${equal ? 'equal, so this is a duplicate.' : 'not equal.'}`,
        { items: equal ? { [i]: 'done', [j]: 'done' } : { [i]: 'current', [j]: 'compare' } },
        {
          vars: { i, j },
          question:
            comparisons === 1
              ? ask(
                  'How many comparisons will the nested loops make?',
                  pairsToFirstMatch,
                  [items.length * items.length, items.length, items.length * (items.length - 1)],
                  nestedFound
                    ? `It stops at the first equal pair, after ${plural(pairsToFirstMatch, 'comparison')}.`
                    : `Each item is compared with every item after it: ${plural(items.length, 'item')} make ${plural(pairsToFirstMatch, 'pair')}.`,
                )
              : undefined,
        },
      )
      if (equal) {
        matched = true
        break
      }
    }
  }
  returned = nestedFound
  if (nestedFound) {
    snapshot(4, 'Found an equal pair, so return true and the function stops right away.', { items: {} })
  } else {
    snapshot(
      7,
      items.length < 2 ? 'There are no pairs to compare, so return false.' : 'No pair was equal, so return false.',
      { items: {} },
    )
  }

  // ---- Part 2: a Set ----
  returned = undefined
  const seen: number[] = []
  snapshot(10, `Now the same list with a Set: call hasDuplicateFast with ${list}.`, { items: {}, seen: { values: seen } })
  for (let k = 0; k < items.length; k++) {
    const item = items[k]
    lookups++
    const found = seen.includes(item)
    snapshot(
      13,
      `seen.has(${item}) looks the item up in one step: ${found ? 'it is there, so this is a duplicate.' : 'it is not there.'}`,
      { items: { [k]: found ? 'done' : 'current' }, seen: { values: seen, marks: found ? { [seen.indexOf(item)]: 'done' } : {} } },
      {
        vars: { item },
        question:
          lookups === 1
            ? ask(
                'How many lookups will the Set make?',
                lookupsTotal,
                [pairsToFirstMatch, lookupsTotal + 1, lookupsTotal * 2, 1],
                setFound
                  ? `The Set makes one lookup per item and stops at the first repeat: ${plural(lookupsTotal, 'lookup')}.`
                  : `The Set makes one lookup per item: ${plural(lookupsTotal, 'lookup')}.`,
              )
            : undefined,
      },
    )
    if (found) {
      returned = true
      snapshot(
        13,
        `Found a repeat, so return true. The Set made ${plural(lookups, 'lookup')}; the nested loops made ${plural(comparisons, 'comparison')}.`,
        { items: { [k]: 'done' }, seen: { values: seen } },
      )
      return frames
    }
    seen.push(item)
    snapshot(14, `${item} is new, so add puts it in the Set.`, { items: { [k]: 'current' }, seen: { values: seen, marks: { [seen.length - 1]: 'current' } } }, { vars: { item } })
  }
  returned = false
  snapshot(
    16,
    `Every item was new, so return false. The Set made ${plural(lookups, 'lookup')}; the nested loops made ${plural(comparisons, 'comparison')}.`,
    { items: {}, seen: { values: seen } },
  )
  return frames
}
