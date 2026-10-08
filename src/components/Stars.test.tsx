import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DifficultyDots } from './DifficultyDots'
import { Stars } from './Stars'

describe('Stars', () => {
  it.each([
    [0, '0 of 3 stars'],
    [1, '1 of 3 stars'],
    [3, '3 of 3 stars'],
  ])('with %i earned is labelled %s', (count, label) => {
    render(<Stars count={count as 0 | 1 | 2 | 3} />)
    expect(screen.getByRole('img', { name: label })).toBeInTheDocument()
  })

  it('fills only the earned stars', () => {
    render(<Stars count={2} />)
    const stars = screen.getByRole('img').querySelectorAll('[data-filled]')
    expect([...stars].map((s) => s.getAttribute('data-filled'))).toEqual(['true', 'true', 'false'])
  })
})

describe('DifficultyDots', () => {
  it.each([
    [1, 'Difficulty: easy'],
    [2, 'Difficulty: medium'],
    [3, 'Difficulty: hard'],
  ])('level %i is labelled %s', (level, label) => {
    render(<DifficultyDots level={level as 1 | 2 | 3} />)
    expect(screen.getByRole('img', { name: label })).toBeInTheDocument()
  })

  it('fills one dot per level out of three', () => {
    render(<DifficultyDots level={2} />)
    const dots = screen.getByRole('img').querySelectorAll('[data-filled]')
    expect([...dots].map((d) => d.getAttribute('data-filled'))).toEqual(['true', 'true', 'false'])
  })
})
