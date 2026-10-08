import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { initialState } from '../progress/state'
import { renderWithProgress } from '../test/renderWithProgress'
import { Badges } from './Badges'

const earned = {
  ...initialState(),
  badges: { 'first-run': '2026-10-06', 'first-quiz': '2026-10-07' },
}
const card = (title: string) => screen.getByRole('listitem', { name: title })

describe('Badges page', () => {
  it('has a title, a way back and the earned count', () => {
    renderWithProgress(<Badges />, { state: earned })
    expect(screen.getByRole('heading', { level: 1, name: 'Badges' })).toBeInTheDocument()
    expect(screen.getByText('2 of 9 earned')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to the map/i })).toHaveAttribute('href', '#/')
    expect(document.title).toBe('Badges · Stepwise')
  })

  it('lists all nine badges', () => {
    renderWithProgress(<Badges />)
    expect(screen.getAllByRole('listitem')).toHaveLength(9)
  })

  it('shows an earned badge with its description and the day it was earned', () => {
    renderWithProgress(<Badges />, { state: earned })
    const first = card('First Run')
    expect(first).toHaveAttribute('data-earned', 'true')
    expect(first).toHaveTextContent('You watched an algorithm run all the way through.')
    expect(first).toHaveTextContent('Earned Oct 6, 2026')
    expect(first).not.toHaveTextContent('Locked')
  })

  it('shows a locked badge with how to earn it, in text', () => {
    renderWithProgress(<Badges />, { state: earned })
    const locked = card('Perfect Score')
    expect(locked).toHaveAttribute('data-earned', 'false')
    expect(locked).toHaveTextContent('Locked')
    expect(locked).toHaveTextContent('Get 3 stars on any topic.')
  })

  it('says nothing about a missing topic for a badge whose topic is built', () => {
    renderWithProgress(<Badges />)
    for (const title of ['First Run', 'Hidden Loop Spotter', 'Set Master', 'Pointer Pro']) {
      expect(within(card(title)).queryByText(/topic isn.t built yet/i)).not.toBeInTheDocument()
    }
    expect(card('Hidden Loop Spotter')).toHaveTextContent('Locked. Complete "The hidden loop".')
    expect(card('Set Master')).toHaveTextContent('Locked. Complete "Duplicate check: loops vs a Set".')
    expect(card('Pointer Pro')).toHaveTextContent('Locked. Complete "Two pointers".')
  })
})
