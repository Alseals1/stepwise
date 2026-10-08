import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Seat } from '../engine/types'
import { SeatRow } from './SeatRow'

const seats: Seat[] = [
  { id: 1, value: 3, seat: 0 },
  { id: 2, value: 5, seat: 1, mark: 'moving' },
  { id: 3, value: -8, seat: 3, mark: 'new' },
]
const seatVar = (el: HTMLElement) => el.style.getPropertyValue('--seat')

describe('SeatRow', () => {
  it('lists each box with its seat number and value for assistive tech', () => {
    render(<SeatRow seats={seats} seatCount={5} />)
    const list = screen.getByRole('list', { name: 'Seats' })
    const items = within(list).getAllByRole('listitem')
    expect(items.map((li) => li.getAttribute('aria-label'))).toEqual(['Seat 0: 3', 'Seat 1: 5', 'Seat 3: -8'])
  })

  it('places each box by its seat number, so a changed seat makes it glide', () => {
    render(<SeatRow seats={seats} seatCount={5} />)
    const items = screen.getAllByRole('listitem')
    expect(items.map(seatVar)).toEqual(['0', '1', '3'])
  })

  it('draws an outline for every seat in the row, numbered, even the empty ones', () => {
    const { container } = render(<SeatRow seats={seats} seatCount={5} />)
    const slots = [...container.querySelectorAll('.seat-slot')]
    expect(slots).toHaveLength(5)
    expect(slots.map((s) => s.getAttribute('data-index'))).toEqual(['0', '1', '2', '3', '4'])
    expect(slots.every((s) => s.getAttribute('aria-hidden') === 'true')).toBe(true)
  })

  it('tells the stylesheet how many seats there are, so it can size the boxes to fit', () => {
    const { container } = render(<SeatRow seats={seats} seatCount={7} />)
    expect((container.querySelector('.seat-row') as HTMLElement).style.getPropertyValue('--seat-count')).toBe('7')
  })

  it('shows the mark of each box', () => {
    render(<SeatRow seats={seats} seatCount={5} />)
    const items = screen.getAllByRole('listitem')
    expect(items.map((li) => li.getAttribute('data-mark'))).toEqual([null, 'moving', 'new'])
  })

  it('says in words when a box has been removed', () => {
    render(<SeatRow seats={[{ id: 1, value: 8, seat: 2, mark: 'removed' }]} seatCount={3} />)
    expect(screen.getByRole('listitem')).toHaveAccessibleName('Seat 2: 8 (removed)')
  })

  it('keeps the same element for the same box when its seat changes, so the move can be animated', () => {
    const { rerender } = render(<SeatRow seats={[{ id: 7, value: 4, seat: 1 }]} seatCount={4} />)
    const before = screen.getByRole('listitem')
    rerender(<SeatRow seats={[{ id: 7, value: 4, seat: 2, mark: 'moving' }]} seatCount={4} />)
    const after = screen.getByRole('listitem')
    expect(after).toBe(before)
    expect(seatVar(after)).toBe('2')
  })

  it('does not reorder its elements when seats change, which would restart the animation', () => {
    const { rerender } = render(
      <SeatRow
        seats={[
          { id: 1, value: 1, seat: 0 },
          { id: 2, value: 2, seat: 1 },
        ]}
        seatCount={3}
      />,
    )
    const [first] = screen.getAllByRole('listitem')
    rerender(
      <SeatRow
        seats={[
          { id: 1, value: 1, seat: 2 },
          { id: 2, value: 2, seat: 0 },
        ]}
        seatCount={3}
      />,
    )
    expect(screen.getAllByRole('listitem')[0]).toBe(first)
  })

  it('shows boxes appearing and disappearing as the list of seats changes', () => {
    const { rerender } = render(<SeatRow seats={[{ id: 1, value: 1, seat: 0 }]} seatCount={3} />)
    rerender(
      <SeatRow
        seats={[
          { id: 1, value: 1, seat: 0 },
          { id: 2, value: 9, seat: 1, mark: 'new' },
        ]}
        seatCount={3}
      />,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    rerender(<SeatRow seats={[{ id: 2, value: 9, seat: 0 }]} seatCount={3} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })
})
