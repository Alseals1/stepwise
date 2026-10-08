/**
 * Builds the answer options for a "what happens next?" question about a number.
 * The right answer goes in a rotating position (so it is not always A); wrong answers are
 * de-duplicated and topped up with nearby numbers when there are too few.
 */
export function buildChoices(
  correct: number,
  wrong: number[],
  position: number,
  count = 3,
): { options: string[]; answer: number } {
  const distractors: number[] = []
  const add = (value: number) => {
    if (value !== correct && !distractors.includes(value)) distractors.push(value)
  }
  wrong.forEach(add)
  for (let step = 1; distractors.length < count - 1; step++) {
    add(correct + step)
    if (distractors.length < count - 1) add(correct - step)
  }

  const options = distractors.slice(0, count - 1).map(String)
  const answer = ((position % count) + count) % count
  options.splice(answer, 0, String(correct))
  return { options, answer }
}
