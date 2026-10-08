import { buildChoices } from '../../engine/choices'
import type { Ask, Frame, Mark, Row } from '../../engine/types'

export interface HashMapTwoSumInput {
  /** Any order. */
  nums: number[]
  target: number
}

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`
/** Negative numbers get brackets inside a sum, so "5 - (-3)" reads correctly. */
const operand = (n: number) => (n < 0 ? `(${n})` : String(n))

const SEEN_LABEL = 'seen (value → index)'

/**
 * Two Sum on any list with a Map from value to index: for each item work out the complement, look
 * it up, and either return both indexes or store the item. The lookup comes before the store, so an
 * item never pairs with itself. Counts the lookups, which is at most n.
 */
export function record({ nums, target }: HashMapTwoSumInput): Frame[] {
  const frames: Frame[] = []
  const n = nums.length
  const pairs = (n * (n - 1)) / 2
  let asked = 0

  // The real algorithm, run once up front, to know which lookups are worth a question.
  const probe = new Map<number, number>()
  let hitAt = -1
  for (let i = 0; i < n && hitAt === -1; i++) {
    if (probe.has(target - nums[i])) hitAt = i
    else probe.set(nums[i], i)
  }
  const lookupAskAt = new Set([Math.min(2, n - 1), hitAt].filter((i) => i >= 0))

  // The Map, in insertion order; `set` on a key that is already there keeps its place.
  const keys: number[] = []
  const indexes: number[] = []
  const store = (value: number, index: number) => {
    const at = keys.indexOf(value)
    if (at === -1) {
      keys.push(value)
      indexes.push(index)
      return { at: keys.length - 1, replaced: undefined as number | undefined }
    }
    const replaced = indexes[at]
    indexes[at] = index
    return { at, replaced }
  }

  function snapshot(
    line: number,
    say: string,
    shown: { nums?: Record<number, Mark>; seen?: Record<number, Mark> },
    vars: Frame['vars'] = {},
    question?: Ask,
  ) {
    const rows: Row[] = [
      { label: 'nums', values: nums, marks: shown.nums ?? {} },
      { label: SEEN_LABEL, values: [...keys], marks: shown.seen ?? {}, indexes: [...indexes] },
    ]
    frames.push({ line, vars: { nums, target, ...vars }, say, rows, ask: question })
  }

  const list = `[${nums.join(', ')}]`
  snapshot(1, `Call twoSumHash with ${list} and target ${target}. The list can be in any order.`, {})
  let lookups = 0
  snapshot(2, 'Create an empty Map called seen. It will remember each number and the index it was at.', {}, { lookups })

  for (let i = 0; i < n; i++) {
    const item = nums[i]
    const complement = target - item

    // Complement step. Asked on the second item, so a question never comes on the first step.
    const complementAsk =
      i === 1
        ? (() => {
            const { options, answer } = buildChoices(complement, [item, target + item, target], asked++)
            return {
              question: `The target is ${target} and this number is ${item}. What complement do we look for?`,
              options,
              answer,
              explain: `The partner is the target minus this number: ${target} - ${operand(item)} = ${complement}.`,
            }
          })()
        : undefined
    snapshot(
      4,
      `The partner of ${item} must be ${target} - ${operand(item)} = ${complement}, so ${complement} is what we look for.`,
      { nums: { [i]: 'current' } },
      { i, complement, lookups },
      complementAsk,
    )

    // Lookup step.
    lookups++
    const at = keys.indexOf(complement)
    const found = at !== -1
    const lookupAsk = lookupAskAt.has(i)
      ? (() => {
          const answer = asked++ % 2
          const options = ['Yes', 'No']
          const right = found ? 'Yes' : 'No'
          if (options[answer] !== right) options.reverse()
          return {
            question: `Is ${complement} already stored in the Map?`,
            options,
            answer: options.indexOf(right),
            explain: found
              ? `${complement} was stored at index ${indexes[at]} earlier, so the lookup finds it.`
              : keys.length === 0
                ? `The Map is still empty, so ${complement} cannot be there.`
                : `The Map holds only [${keys.join(', ')}], so ${complement} is not there yet.`,
          }
        })()
      : undefined

    if (found) {
      const partner = indexes[at]
      const pairMarks: Record<number, Mark> = { [partner]: 'done', [i]: 'done' }
      snapshot(
        5,
        `seen.has(${complement}) looks in the Map in one step: ${complement} is there, stored at index ${partner}, and ${operand(complement)} + ${operand(item)} = ${target}.`,
        { nums: pairMarks, seen: { [at]: 'done' } },
        { i, complement, lookups },
        lookupAsk,
      )
      snapshot(
        6,
        `Return [${partner}, ${i}]: the stored index first, then this one. That took ${plural(lookups, 'lookup')}; nested loops could have needed up to ${plural(pairs, 'pair')}. It works on any order but the Map holds up to n items, where two pointers needs a sorted list and no extra memory.`,
        { nums: pairMarks, seen: { [at]: 'done' } },
        { i, complement, lookups, result: [partner, i] },
      )
      return frames
    }

    snapshot(
      5,
      `seen.has(${complement}) looks in the Map in one step: ${complement} is not there, so no earlier number pairs with ${item}.${
        complement === item ? ' An item is stored only after its lookup, so it can never pair with itself.' : ''
      }`,
      { nums: { [i]: 'current' } },
      { i, complement, lookups },
      lookupAsk,
    )

    // Store step.
    const stored = store(item, i)
    snapshot(
      8,
      stored.replaced === undefined
        ? `${item} has no partner yet, so seen.set(${item}, ${i}) stores it with its index for later items to find.`
        : `${item} is already in the Map (at index ${stored.replaced}), so seen.set(${item}, ${i}) replaces its index with ${i}.`,
      { nums: { [i]: 'current' }, seen: { [stored.at]: 'current' } },
      { i, complement, lookups },
    )
  }

  snapshot(
    10,
    n === 0
      ? 'The list is empty, so there is nothing to look up: return [].'
      : `Every item has been looked up and none found a partner, so return []. That took ${plural(lookups, 'lookup')}, against ${plural(pairs, 'pair')} for nested loops, and the Map ended up holding ${plural(keys.length, 'item')}.`,
    {},
    { lookups, result: [] },
  )
  return frames
}
