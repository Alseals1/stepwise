import type { Frame, Mark } from '../../engine/types'

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

  let total = 0
  numbers.forEach((n, i) => {
    frames.push({
      line: 3,
      vars: { numbers, total, n },
      say: `Pick up the next number, ${n}.`,
      array: numbers,
      marks: marksUpTo(i),
    })
    total += n
    frames.push({
      line: 4,
      vars: { numbers, total, n },
      say: `Add ${n} to the total, which is now ${total}.`,
      array: numbers,
      marks: marksUpTo(i),
    })
  })

  frames.push({
    line: 6,
    vars: { numbers, total },
    say: `Every number is counted, so return ${total}.`,
    array: numbers,
    marks: marksUpTo(numbers.length),
  })
  return frames
}
