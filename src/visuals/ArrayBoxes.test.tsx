import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ArrayBoxes } from './ArrayBoxes'

describe('ArrayBoxes', () => {
  it('shows one box per value with its index', () => {
    render(<ArrayBoxes array={[2, 4, 6]} />)
    const boxes = screen.getAllByRole('listitem')
    expect(boxes).toHaveLength(3)
    expect(boxes[1]).toHaveTextContent('4')
    expect(boxes[1]).toHaveTextContent('1')
  })

  it('styles boxes by mark and flags the current one for assistive tech', () => {
    render(<ArrayBoxes array={[2, 4, 6]} marks={{ 0: 'done', 1: 'current' }} />)
    const [done, current, plain] = screen.getAllByRole('listitem')
    expect(done).toHaveAttribute('data-mark', 'done')
    expect(done).toHaveTextContent('done')
    expect(current).toHaveAttribute('data-mark', 'current')
    expect(current).toHaveAttribute('aria-current', 'true')
    expect(plain).not.toHaveAttribute('data-mark')
    expect(plain).not.toHaveAttribute('aria-current')
  })

  it('says so when the array is empty', () => {
    render(<ArrayBoxes array={[]} />)
    expect(screen.getByText('Empty array')).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('labels the list', () => {
    render(<ArrayBoxes array={[1]} />)
    expect(screen.getByRole('list', { name: 'Array' })).toBeInTheDocument()
  })
})
