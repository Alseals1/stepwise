import { buildChoices } from '../../engine/choices'
import type { Ask, Frame, Seat, SeatMark } from '../../engine/types'

interface Box {
  id: number
  value: number
  seat: number
}

const PUSHED = 9
const UNSHIFTED = 1

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

/**
 * Runs push(9), unshift(1), pop() and shift() on the learner's array, one visible step at a time.
 * Every element that has to move gets its own step, so the cost of the front of an array shows.
 */
export function record(start: number[]): Frame[] {
  let nextId = 0
  const boxes: Box[] = start.map((value, seat) => ({ id: nextId++, value, seat }))
  const seatCount = start.length + 2 // the most seats this run ever needs
  const frames: Frame[] = []
  let moves = 0
  let returned: number | undefined
  let asked = 0

  const ask = (question: string, correct: number, wrong: number[], explain: string): Ask => {
    const { options, answer } = buildChoices(correct, wrong, asked++)
    return { question, options, answer, explain }
  }

  function snapshot(line: number, say: string, marks: Record<number, SeatMark> = {}, question?: Ask) {
    // A fixed order (by id, not by seat), so the same box keeps the same element and can glide.
    const seats: Seat[] = [...boxes].sort((a, b) => a.id - b.id).map((box) => ({ ...box, mark: marks[box.id] }))
    const live = seats.filter((s) => s.mark !== 'removed').sort((a, b) => a.seat - b.seat)
    const vars: Frame['vars'] = { seats: live.map((s) => s.value), moves }
    if (returned !== undefined) vars.returned = returned
    frames.push({ line, vars, say, seats, seatCount, ask: question })
  }

  const boxAt = (seat: number) => boxes.find((b) => b.seat === seat)!
  const remove = (box: Box) => boxes.splice(boxes.indexOf(box), 1)

  snapshot(1, `Call demo with [${start.join(', ')}].`)

  // push: the end of the row already has a free seat.
  const pushed: Box = { id: nextId++, value: PUSHED, seat: boxes.length }
  boxes.push(pushed)
  snapshot(
    2,
    `push(${PUSHED}) puts ${PUSHED} in the next free seat at the end, so nothing else moves.`,
    { [pushed.id]: 'new' },
    ask(
      'How many elements will move when we push?',
      0,
      [1, start.length],
      'push adds at the end, where there is already a free seat, so nothing moves.',
    ),
  )

  // unshift: seat 0 is taken, so every element slides right, starting from the last one.
  const before = boxes.length
  for (let seat = before - 1; seat >= 0; seat--) {
    const box = boxAt(seat)
    box.seat = seat + 1
    moves++
    snapshot(
      3,
      `unshift(${UNSHIFTED}) needs seat 0, so the element in seat ${seat} slides to seat ${seat + 1}.`,
      { [box.id]: 'moving' },
      seat === before - 1
        ? ask(
            'How many elements will move when we unshift?',
            before,
            [0, 1],
            before === 1
              ? 'unshift needs seat 0, so the 1 element already in the array moves one seat right.'
              : `unshift needs seat 0, so all ${before} elements already in the array move one seat right.`,
          )
        : undefined,
    )
  }
  const inserted: Box = { id: nextId++, value: UNSHIFTED, seat: 0 }
  boxes.push(inserted)
  snapshot(3, `Seat 0 is free now, so ${UNSHIFTED} goes in.`, { [inserted.id]: 'new' })

  // pop: the last seat empties and nobody else has to move.
  const last = boxes.reduce((a, b) => (b.seat > a.seat ? b : a))
  returned = last.value
  // The box stays visible for this one step, struck through, so the removal is a step of its own.
  snapshot(
    4,
    `pop() removes the last element, ${last.value}, and returns it, so nothing else moves.`,
    { [last.id]: 'removed' },
    ask(
      'How many elements will move when we pop?',
      0,
      [1, boxes.length],
      'pop removes the last seat, so nothing else moves.',
    ),
  )
  remove(last)

  // shift: seat 0 empties, so every remaining element slides left, starting from the first.
  const first = boxAt(0)
  const remaining = boxes.length - 1
  returned = first.value
  snapshot(
    5,
    `shift() removes the first element, ${first.value}, and returns it.`,
    { [first.id]: 'removed' },
    ask(
      'How many elements will move when we shift?',
      remaining,
      [0, remaining + 1],
      remaining === 0
        ? 'shift empties seat 0, and there is nobody left to move.'
        : `shift empties seat 0, so the ${plural(remaining, 'remaining element')} ${remaining === 1 ? 'moves' : 'each move'} one seat left.`,
    ),
  )
  remove(first)
  for (let seat = 1; seat <= remaining; seat++) {
    const box = boxAt(seat)
    box.seat = seat - 1
    moves++
    snapshot(5, `Seat ${seat - 1} is empty, so the element in seat ${seat} slides to seat ${seat - 1}.`, { [box.id]: 'moving' })
  }

  const finalValues = [...boxes].sort((a, b) => a.seat - b.seat).map((b) => b.value)
  snapshot(6, `Return the array: [${finalValues.join(', ')}].`)
  return frames
}
