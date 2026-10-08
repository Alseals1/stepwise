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
