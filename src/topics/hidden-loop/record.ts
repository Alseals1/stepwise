import { buildChoices } from '../../engine/choices'
import type { Ask, Frame, Mark } from '../../engine/types'

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

/**
 * Runs hasDuplicate(items), which calls seen.includes(item) inside a loop. Every comparison that
 * includes makes is its own step, so the hidden loop inside that one line of code is visible.
 */
export function record(items: number[]): Frame[] {
  const seen: number[] = []
  const frames: Frame[] = []
  let comparisons = 0
  let returned: boolean | undefined
  let asked = 0

  const ask = (item: number, correct: number, explain: string): Ask => {
    const { options, answer } = buildChoices(correct, [seen.length, 1, seen.length + 1], asked++)
    return { question: `How many comparisons will includes make for ${item}?`, options, answer, explain }
  }

  function snapshot(
    line: number,
    say: string,
    marks: { items?: Record<number, Mark>; seen?: Record<number, Mark> } = {},
    extra: { item?: number; question?: Ask } = {},
  ) {
    const vars: Frame['vars'] = { items, seen: [...seen], comparisons }
    if (extra.item !== undefined) vars.item = extra.item
    if (returned !== undefined) vars.returned = returned
    frames.push({
      line,
      vars,
      say,
      rows: [
        { label: 'items', values: items, marks: marks.items },
        { label: 'seen', values: [...seen], marks: marks.seen },
      ],
      ask: extra.question,
    })
  }

  const doneBefore = (i: number): Record<number, Mark> => Object.fromEntries(Array.from({ length: i }, (_, j) => [j, 'done']))

  snapshot(1, `Call hasDuplicate with [${items.join(', ')}].`)

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const current: Record<number, Mark> = { ...doneBefore(i), [i]: 'current' }
    snapshot(3, `Pick up the next item, ${item}.`, { items: current }, { item })

    // seen.includes(item): one line of code, but it compares item with the elements of seen one by one.
    const match = seen.indexOf(item)
    const needed = match === -1 ? seen.length : match + 1
    const explain =
      seen.length === 0
        ? 'seen is empty, so there is nothing to compare with.'
        : match === -1
          ? `${item} is not in seen, so includes checks all ${plural(seen.length, 'element')}.`
          : `includes stops at the first match, at index ${match}, so it makes ${plural(needed, 'comparison')}.`

    if (seen.length === 0) {
      snapshot(4, 'seen is empty, so includes has nothing to compare with: 0 comparisons.', { items: current }, { item, question: ask(item, 0, explain) })
    }
    for (let j = 0; j < seen.length; j++) {
      comparisons++
      const found = seen[j] === item
      snapshot(
        4,
        found
          ? `includes compares ${item} with ${seen[j]}: a match, so it stops right away.`
          : `includes compares ${item} with ${seen[j]}: not equal, so it keeps looking.`,
        { items: current, seen: { [j]: found ? 'done' : 'current' } },
        { item, question: j === 0 ? ask(item, needed, explain) : undefined },
      )
      if (found) break
    }

    if (match !== -1) {
      returned = true
      snapshot(4, 'The condition is true, so return true runs and the function stops right away.', { items: current, seen: { [match]: 'done' } }, { item })
      return frames
    }

    seen.push(item)
    snapshot(5, `${item} is new, so push adds it to seen.`, { items: current, seen: { [seen.length - 1]: 'current' } }, { item })
  }

  returned = false
  snapshot(7, 'Every item was new, so return false.', { items: doneBefore(items.length) })
  return frames
}
