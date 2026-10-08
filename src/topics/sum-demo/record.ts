import { buildChoices } from '../../engine/choices'
import type { Ask, Frame, Mark } from '../../engine/types'

/** Each frame shows the state after its line has run. */
export function record(numbers: number[]): Frame[] {
  const frames: Frame[] = []
  const marksUpTo = (i: number): Record<number, Mark> => {
    const marks: Record<number, Mark> = {}
    for (let j = 0; j < i; j++) marks[j] = 'done'
    if (i < numbers.length) marks[i] = 'current'
    return marks
  }

  frames.push({
    line: 1,
    vars: { numbers },
    say: `Call sum with [${numbers.join(', ')}].`,
    array: numbers,
  })
  frames.push({
    line: 2,
    vars: { numbers, total: 0 },
    say: 'Start the running total at 0, like an empty piggy bank.',
    array: numbers,
  })

  // Each question puts its right answer in the next position, so it is not always the first.
  let asked = 0
  const ask = (question: string, correct: number, wrong: number[], explain: string): Ask => {
    const { options, answer } = buildChoices(correct, wrong, asked++)
    return { question, options, answer, explain }
  }

  let total = 0
  numbers.forEach((n, i) => {
    frames.push({
      line: 3,
      vars: { numbers, total, n },
      say: `Pick up the next number, ${n}.`,
      array: numbers,
      marks: marksUpTo(i),
    })
    const before = total
    total += n
    frames.push({
      line: 4,
      vars: { numbers, total, n },
      say: `Add ${n} to the total, which is now ${total}.`,
      array: numbers,
      marks: marksUpTo(i),
      ask: ask(
        `What will total be after adding ${n}?`,
        total,
        [before, n], // forgetting to add, or replacing the total instead of adding
        `total was ${before} and ${n} is added, so it becomes ${total}.`,
      ),
    })
  })

  frames.push({
    line: 6,
    vars: { numbers, total },
    say: `Every number is counted, so return ${total}.`,
    array: numbers,
    marks: marksUpTo(numbers.length),
    ask: ask(
      'What will sum return?',
      total,
      [numbers.length, numbers.at(-1) ?? 0], // the count, or just the last number
      `The loop is done and total is ${total}, so that is what comes back.`,
    ),
  })
  return frames
}
