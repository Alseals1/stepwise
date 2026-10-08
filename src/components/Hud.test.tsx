import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { initialState, type SavedState } from '../progress/state'
import { renderWithProgress } from '../test/renderWithProgress'
import { Hud } from './Hud'
import { StatsPanel } from './StatsPanel'

const withStreak = (current: number, longest: number, last = '2026-10-08', freeze: string | null = null): SavedState => ({
  ...initialState(),
  streak: { current, longest, lastStudyDay: last, freezeUsedWeek: freeze },
})

describe('Hud', () => {
  it('invites you to start a streak when there is none', () => {
    renderWithProgress(<Hud />)
    expect(screen.getByText('Start a streak')).toBeInTheDocument()
  })

  it('shows the current streak', () => {
    renderWithProgress(<Hud />, { state: withStreak(3, 3) })
    expect(screen.getByText('3-day streak')).toBeInTheDocument()
  })

  it('shows a lapsed streak as not started', () => {
    renderWithProgress(<Hud />, { state: withStreak(5, 5, '2026-10-01') })
    expect(screen.getByText('Start a streak')).toBeInTheDocument()
  })

  it('links to the badges page with the earned count', () => {
    renderWithProgress(<Hud />, { state: { ...initialState(), badges: { 'first-run': '2026-10-06', 'first-quiz': '2026-10-06' } } })
    expect(screen.getByRole('link', { name: '2 of 9 badges' })).toHaveAttribute('href', '#/badges')
  })

  it('is a labelled group', () => {
    renderWithProgress(<Hud />)
    expect(screen.getByRole('group', { name: 'Your progress' })).toBeInTheDocument()
  })
})

describe('StatsPanel', () => {
  it('shows current streak, best streak and the freeze status', () => {
    renderWithProgress(<StatsPanel />, { state: withStreak(3, 7) })
    const panel = screen.getByRole('region', { name: 'Streak' })
    expect(within(panel).getByText('Current streak').nextElementSibling).toHaveTextContent('3 days')
    expect(within(panel).getByText('Best streak').nextElementSibling).toHaveTextContent('7 days')
    expect(within(panel).getByText('Weekly freeze').nextElementSibling).toHaveTextContent('Ready')
  })

  it('uses the singular for one day', () => {
    renderWithProgress(<StatsPanel />, { state: withStreak(1, 1) })
    expect(screen.getByText('Current streak').nextElementSibling).toHaveTextContent('1 day')
  })

  it('says when this week’s freeze has been used', () => {
    renderWithProgress(<StatsPanel />, { state: withStreak(3, 3, '2026-10-08', '2026-10-05') })
    expect(screen.getByText('Weekly freeze').nextElementSibling).toHaveTextContent('Used this week')
  })
})
