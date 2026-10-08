import { describe, expect, it } from 'vitest'
import type { Frame, Seat } from '../../engine/types'
import { record } from './record'

const frames = record([3, 5, 8])
const seatsOf = (f: Frame): Seat[] => f.seats ?? []
const bySeat = (f: Frame) =>
  [...seatsOf(f)].sort((a, b) => a.seat - b.seat).map((s) => `${s.seat}:${s.value}${s.mark ? `(${s.mark})` : ''}`)

describe('array basics: the walkthrough for [3, 5, 8]', () => {
  it('has 13 steps: start, push, unshift (4 moves and an insert), pop, shift (a removal and 3 moves), return', () => {
    expect(frames).toHaveLength(13)
    expect(frames.map((f) => f.line)).toEqual([1, 2, 3, 3, 3, 3, 3, 4, 5, 5, 5, 5, 6])
  })

  it('starts by calling the function on the learner’s array', () => {
    expect(frames[0].say).toBe('Call demo with [3, 5, 8].')
    expect(bySeat(frames[0])).toEqual(['0:3', '1:5', '2:8'])
  })

  it('push puts 9 in the next free seat and nothing else moves', () => {
    expect(frames[1].say).toBe('push(9) puts 9 in the next free seat at the end, so nothing else moves.')
    expect(bySeat(frames[1])).toEqual(['0:3', '1:5', '2:8', '3:9(new)'])
    expect(frames[1].vars.moves).toBe(0)
  })

  it('unshift moves every element one seat to the right, last first, one step each, then inserts 1', () => {
    expect(frames[2].say).toBe('unshift(1) needs seat 0, so the element in seat 3 slides to seat 4.')
    expect(bySeat(frames[2])).toEqual(['0:3', '1:5', '2:8', '4:9(moving)'])
    expect(bySeat(frames[3])).toEqual(['0:3', '1:5', '3:8(moving)', '4:9'])
    expect(bySeat(frames[4])).toEqual(['0:3', '2:5(moving)', '3:8', '4:9'])
    expect(bySeat(frames[5])).toEqual(['1:3(moving)', '2:5', '3:8', '4:9'])
    expect(frames[6].say).toBe('Seat 0 is free now, so 1 goes in.')
    expect(bySeat(frames[6])).toEqual(['0:1(new)', '1:3', '2:5', '3:8', '4:9'])
  })

  it('pop removes the last element, returns it, and nothing else moves', () => {
    expect(frames[7].say).toBe('pop() removes the last element, 9, and returns it, so nothing else moves.')
    expect(bySeat(frames[7])).toEqual(['0:1', '1:3', '2:5', '3:8', '4:9(removed)'])
    expect(frames[7].vars.returned).toBe(9)
  })

  it('shift removes the first element, then every remaining element slides one seat left, one step each', () => {
    expect(frames[8].say).toBe('shift() removes the first element, 1, and returns it.')
    expect(bySeat(frames[8])).toEqual(['0:1(removed)', '1:3', '2:5', '3:8'])
    expect(frames[8].vars.returned).toBe(1)
    expect(frames[9].say).toBe('Seat 0 is empty, so the element in seat 1 slides to seat 0.')
    expect(bySeat(frames[9])).toEqual(['0:3(moving)', '2:5', '3:8'])
    expect(bySeat(frames[10])).toEqual(['0:3', '1:5(moving)', '3:8'])
    expect(bySeat(frames[11])).toEqual(['0:3', '1:5', '2:8(moving)'])
  })

  it('ends by returning the array', () => {
    expect(frames[12].say).toBe('Return the array: [3, 5, 8].')
    expect(bySeat(frames[12])).toEqual(['0:3', '1:5', '2:8'])
    expect(frames[12].vars.seats).toEqual([3, 5, 8])
  })

  it('counts every element moved, so the cost of the front is visible', () => {
    expect(frames.map((f) => f.vars.moves)).toEqual([0, 0, 1, 2, 3, 4, 4, 4, 4, 5, 6, 7, 7])
  })

  it('shows the array as it stands, in seat order', () => {
    expect(frames[1].vars.seats).toEqual([3, 5, 8, 9])
    expect(frames[6].vars.seats).toEqual([1, 3, 5, 8, 9])
    expect(frames[7].vars.seats).toEqual([1, 3, 5, 8]) // the popped element is already out of the array
    expect(frames[8].vars.seats).toEqual([3, 5, 8])
  })

  it('asks "how many elements will move?" before each of the four operations', () => {
    const asked = frames.flatMap((f, i) => (f.ask ? [[i, f.ask] as const] : []))
    expect(asked.map(([i]) => i)).toEqual([1, 2, 7, 8])
    expect(asked.map(([, a]) => a.question)).toEqual([
      'How many elements will move when we push?',
      'How many elements will move when we unshift?',
      'How many elements will move when we pop?',
      'How many elements will move when we shift?',
    ])
    expect(asked.map(([, a]) => a.options[a.answer])).toEqual(['0', '4', '0', '3'])
    expect(asked.map(([, a]) => a.answer)).toEqual([0, 1, 2, 0]) // not always the first option
  })

  it('explains each answer in terms of seats', () => {
    const asks = frames.flatMap((f) => (f.ask ? [f.ask] : []))
    expect(asks[0].explain).toBe('push adds at the end, where there is already a free seat, so nothing moves.')
    expect(asks[1].explain).toBe('unshift needs seat 0, so all 4 elements already in the array move one seat right.')
    expect(asks[2].explain).toBe('pop removes the last seat, so nothing else moves.')
    expect(asks[3].explain).toBe('shift empties seat 0, so the 3 remaining elements each move one seat left.')
  })
})

describe('array basics: properties that must hold for any starting array', () => {
  const samples: number[][] = [
    [],
    [0],
    [7],
    [1, 2],
    [5, 5, 5],
    [-99, 99],
    [1, 2, 3, 4, 5, 6],
    [99, 99, 99, 99, 99, 99],
    [-99, -99, -99, -99, -99, -99],
    ...Array.from({ length: 40 }, (_, i) => Array.from({ length: i % 7 }, (_, j) => ((i * 13 + j * 29) % 199) - 99)),
  ]

  it.each(samples.map((s) => [JSON.stringify(s), s] as const))('%s: a consistent run', (_name, start) => {
    const run = record(start)
    const n = start.length
    const seatCount = n + 2
    const ids = new Map<number, number>() // id -> value, which must never change

    for (const frame of run) {
      expect(frame.seatCount).toBe(seatCount)
      const seats = seatsOf(frame)
      expect(seats.map((s) => s.id)).toEqual([...seats.map((s) => s.id)].sort((a, b) => a - b)) // stable order
      const taken = seats.map((s) => s.seat)
      expect(new Set(taken).size, 'two boxes share a seat').toBe(taken.length)
      for (const seat of seats) {
        expect(seat.seat).toBeGreaterThanOrEqual(0)
        expect(seat.seat).toBeLessThan(seatCount)
        if (ids.has(seat.id)) expect(ids.get(seat.id)).toBe(seat.value)
        ids.set(seat.id, seat.value)
      }
      const live = seats.filter((s) => s.mark !== 'removed').sort((a, b) => a.seat - b.seat)
      expect(frame.vars.seats).toEqual(live.map((s) => s.value))
    }
    expect(run.at(-1)!.vars.seats).toEqual(start) // push, unshift, pop, shift cancel out
    expect(run.at(-1)!.line).toBe(6)
  })

  it.each(samples.map((s) => [JSON.stringify(s), s] as const))('%s: the right number of steps and moves', (_name, start) => {
    const n = start.length
    const run = record(start)
    // start + push + (n+1 moves + insert) + pop + (removal + n moves) + return
    expect(run).toHaveLength(1 + 1 + (n + 1 + 1) + 1 + (1 + n) + 1)
    expect(run.at(-1)!.vars.moves).toBe(n + 1 + n)
    expect(run.filter((f) => f.ask)).toHaveLength(4)
  })

  it('handles an empty starting array: push, unshift moves the one element, pop and shift move nothing', () => {
    const run = record([])
    expect(run[0].say).toBe('Call demo with [].')
    expect(run.at(-1)!.say).toBe('Return the array: [].')
    const asks = run.flatMap((f) => (f.ask ? [f.ask] : []))
    expect(asks.map((a) => a.options[a.answer])).toEqual(['0', '1', '0', '0'])
  })

  it('does not share state between runs', () => {
    const a = record([1, 2, 3])
    const b = record([1, 2, 3])
    expect(a).toEqual(b)
    record([9, 9])
    expect(record([1, 2, 3])).toEqual(a)
  })
})
