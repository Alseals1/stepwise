import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Row } from '../engine/types'
import { ArrayBoxes } from './ArrayBoxes'
import { RowsView } from './RowsView'

const rows: Row[] = [
  { label: 'items', values: [3, 1, 3], marks: { 0: 'done', 1: 'current' } },
  { label: 'seen', values: [3] },
]

describe('RowsView', () => {
  it('shows each row with its name, as a labelled list of boxes', () => {
    render(<RowsView rows={rows} />)
    const items = screen.getByRole('list', { name: 'items' })
    const seen = screen.getByRole('list', { name: 'seen' })
    expect(within(items).getAllByRole('listitem').map((li) => li.querySelector('.box-value')?.textContent)).toEqual(['3', '1', '3'])
    expect(within(seen).getAllByRole('listitem')).toHaveLength(1)
  })

  it('shows the visible name of each row above its boxes', () => {
    render(<RowsView rows={rows} />)
    expect(screen.getByText('items')).toHaveClass('row-label')
    expect(screen.getByText('seen')).toHaveClass('row-label')
  })

  it('applies each row’s own marks', () => {
    render(<RowsView rows={rows} />)
    const items = within(screen.getByRole('list', { name: 'items' })).getAllByRole('listitem')
    expect(items.map((li) => li.getAttribute('data-mark'))).toEqual(['done', 'current', null])
    const seen = within(screen.getByRole('list', { name: 'seen' })).getAllByRole('listitem')
    expect(seen[0]).not.toHaveAttribute('data-mark')
  })

  it('says so when a row is empty', () => {
    render(<RowsView rows={[{ label: 'seen', values: [] }]} />)
    expect(screen.getByText('seen')).toBeInTheDocument()
    expect(screen.getByText('Empty array')).toBeInTheDocument()
  })

  it('keeps the rows in the order given', () => {
    const { container } = render(<RowsView rows={rows} />)
    expect([...container.querySelectorAll('.row-label')].map((el) => el.textContent)).toEqual(['items', 'seen'])
  })
})

describe('row indexes', () => {
  it('shows the position under each box by default', () => {
    render(<RowsView rows={[{ label: 'items', values: [5, 6] }]} />)
    const boxes = within(screen.getByRole('list', { name: 'items' })).getAllByRole('listitem')
    expect(boxes.map((li) => li.querySelector('.box-index')?.textContent)).toEqual(['0', '1'])
  })

  it('shows the given index under each box when a row has its own, such as a Map from value to index', () => {
    render(<RowsView rows={[{ label: 'seen', values: [2, 9], indexes: [4, 1] }]} />)
    const boxes = within(screen.getByRole('list', { name: 'seen' })).getAllByRole('listitem')
    expect(boxes.map((li) => li.querySelector('.box-index')?.textContent)).toEqual(['4', '1'])
  })

  it('falls back to the position for a box without a given index', () => {
    render(<ArrayBoxes array={[7, 8, 9]} indexes={[5]} />)
    const boxes = screen.getAllByRole('listitem')
    expect(boxes.map((li) => li.querySelector('.box-index')?.textContent)).toEqual(['5', '1', '2'])
  })
})

describe('ArrayBoxes label', () => {
  it('can be given its own accessible name', () => {
    render(<ArrayBoxes array={[1, 2]} label="seen" />)
    expect(screen.getByRole('list', { name: 'seen' })).toBeInTheDocument()
  })

  it('is still called Array by default', () => {
    render(<ArrayBoxes array={[1]} />)
    expect(screen.getByRole('list', { name: 'Array' })).toBeInTheDocument()
  })
})
