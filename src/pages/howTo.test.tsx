import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { SHORTCUTS } from '../engine/shortcuts'
import { useProgress } from '../progress/ProgressContext'
import { renderWithProgress } from '../test/renderWithProgress'
import { HowTo } from './HowTo'

beforeEach(() => {
  window.location.hash = ''
  document.title = ''
})

describe('How-to page', () => {
  it('has a title, a way back and a tab title', () => {
    renderWithProgress(<HowTo />)
    expect(screen.getByRole('heading', { level: 1, name: 'How to use' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to the map/i })).toHaveAttribute('href', '#/')
    expect(document.title).toBe('How to use · Stepwise')
  })

  it('has the six sections, in order', () => {
    renderWithProgress(<HowTo />)
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual([
      'Quick start',
      'Controls and keyboard shortcuts',
      'Reading a topic page',
      'Stars, streak and badges',
      'Your data',
      'Replay the tour',
    ])
  })

  it('starts with three simple steps', () => {
    renderWithProgress(<HowTo />)
    const steps = within(screen.getByRole('list', { name: 'Quick start steps' })).getAllByRole('listitem')
    expect(steps).toHaveLength(3)
    expect(steps[0]).toHaveTextContent(/pick a stage/i)
    expect(steps[1]).toHaveTextContent(/play/i)
    expect(steps[2]).toHaveTextContent(/check yourself/i)
  })

  it('shows every real keyboard shortcut in a table, next to the matching button', () => {
    renderWithProgress(<HowTo />)
    const table = screen.getByRole('table', { name: 'Controls and keyboard shortcuts' })
    for (const shortcut of SHORTCUTS) {
      const row = within(table).getByRole('row', { name: new RegExp(shortcut.action) })
      const [button, keyboard] = within(row).getAllByRole('cell')
      expect(button).toHaveTextContent(shortcut.button)
      expect(keyboard).toHaveTextContent(shortcut.label)
    }
  })

  it('also explains the speed slider and the JS and TS switch', () => {
    renderWithProgress(<HowTo />)
    const table = screen.getByRole('table', { name: 'Controls and keyboard shortcuts' })
    expect(within(table).getByRole('row', { name: /Speed/ })).toHaveTextContent(/slider/i)
    expect(within(table).getByRole('row', { name: /JS or TS/ })).toHaveTextContent(/above the code/i)
  })

  it('explains predict mode: what it does, that nothing blocks, and the number keys', () => {
    renderWithProgress(<HowTo />)
    const reading = screen.getByRole('heading', { name: 'Reading a topic page' }).closest('section')!
    const term = within(reading).getByText('Predict mode')
    const text = term.nextElementSibling!.textContent!
    expect(text).toMatch(/guess/i)
    expect(text).toMatch(/never|nothing/i)
    expect(text).toMatch(/1.*4|number keys/i)
  })

  it('explains stars, the streak with its weekly freeze, and links to the badges', () => {
    renderWithProgress(<HowTo />)
    const section = screen.getByRole('heading', { name: 'Stars, streak and badges' }).closest('section')!
    expect(section).toHaveTextContent('3 stars')
    expect(section).toHaveTextContent(/weekly freeze/i)
    expect(within(section).getByRole('link', { name: /badges/i })).toHaveAttribute('href', '#/badges')
  })

  it('points to the Your data button for backups', () => {
    renderWithProgress(<HowTo />)
    const section = screen.getByRole('heading', { name: 'Your data' }).closest('section')!
    expect(section).toHaveTextContent(/Your data.*header/i)
    expect(section).toHaveTextContent(/backup/i)
  })

  it('replays the tour: asks for it and opens the first topic', async () => {
    const user = userEvent.setup()
    function Probe() {
      return <span data-testid="requested">{String(useProgress().tourRequested)}</span>
    }
    renderWithProgress(
      <>
        <HowTo />
        <Probe />
      </>,
    )
    expect(screen.getByTestId('requested')).toHaveTextContent('false')
    await user.click(screen.getByRole('button', { name: 'Replay the tour' }))
    expect(screen.getByTestId('requested')).toHaveTextContent('true')
    expect(window.location.hash).toBe('#/topic/sum-demo')
  })
})
