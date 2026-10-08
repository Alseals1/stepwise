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

  it('marks the second item of a pair being compared, apart from the first', () => {
    render(<ArrayBoxes array={[4, 7, 2]} marks={{ 0: 'current', 2: 'compare' }} />)
    const boxes = screen.getAllByRole('listitem')
    expect(boxes.map((b) => b.getAttribute('data-mark'))).toEqual(['current', null, 'compare'])
    expect(boxes[2]).not.toHaveAttribute('aria-current')
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

  describe('pointer tags', () => {
    it('shows each pointer as a tag under its box', () => {
      render(
        <ArrayBoxes
          array={[1, 3, 4]}
          pointers={[
            { label: 'left', index: 0 },
            { label: 'right', index: 2 },
          ]}
        />,
      )
      const [first, middle, last] = screen.getAllByRole('listitem')
      expect(first).toHaveTextContent('left')
      expect(first.querySelector('[data-pointer="left"]')).not.toBeNull()
      expect(middle).not.toHaveTextContent(/left|right/)
      expect(last.querySelector('[data-pointer="right"]')).not.toBeNull()
    })

    it('puts two pointers on the same box when they meet', () => {
      render(
        <ArrayBoxes
          array={[5]}
          pointers={[
            { label: 'left', index: 0 },
            { label: 'right', index: 0 },
          ]}
        />,
      )
      const [only] = screen.getAllByRole('listitem')
      expect(only.querySelectorAll('[data-pointer]')).toHaveLength(2)
    })

    it('reserves room for the tags on every box, so nothing jumps when a pointer moves', () => {
      render(<ArrayBoxes array={[1, 3]} pointers={[]} />)
      for (const box of screen.getAllByRole('listitem')) expect(box.querySelector('.box-pointers')).not.toBeNull()
    })

    it('adds nothing when the topic has no pointers', () => {
      render(<ArrayBoxes array={[1, 3]} />)
      expect(document.querySelector('.box-pointers')).toBeNull()
    })

    it('ignores a pointer that is outside the list', () => {
      render(<ArrayBoxes array={[1]} pointers={[{ label: 'right', index: 5 }]} />)
      expect(document.querySelector('[data-pointer]')).toBeNull()
    })
  })
})
