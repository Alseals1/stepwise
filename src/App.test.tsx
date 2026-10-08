import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { highlight } from './engine/highlighter'

vi.mock('./engine/highlighter', () => ({ highlight: vi.fn() }))

beforeEach(() => {
  vi.mocked(highlight).mockReturnValue(new Promise(() => {}))
  window.location.hash = ''
})

describe('App shell', () => {
  it('has a banner with the brand link and tagline on every page', () => {
    render(<App />)
    const banner = screen.getByRole('banner')
    expect(within(banner).getByRole('link', { name: 'Stepwise' })).toHaveAttribute('href', '#/')
    expect(within(banner).getByText(/see every step of an algorithm/i)).toBeInTheDocument()
  })

  it('shows the streak and badge count in the banner on every page', () => {
    render(<App />)
    const hud = within(screen.getByRole('banner')).getByRole('group', { name: 'Your progress' })
    expect(within(hud).getByText('Start a streak')).toBeInTheDocument()
    expect(within(hud).getByRole('link', { name: '0 of 9 badges' })).toHaveAttribute('href', '#/badges')
  })

  it('opens the badges page from its URL', () => {
    window.location.hash = '#/badges'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Badges' })).toBeInTheDocument()
  })

  it('unlocks First Run with a toast and a streak when an animation is played to the end', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/topic/sum-demo'
    render(<App />)
    for (let i = 0; i < 8; i++) await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Badge unlocked: First Run')).toBeInTheDocument()
    const hud = within(screen.getByRole('banner'))
    expect(hud.getByText('1-day streak')).toBeInTheDocument()
    expect(hud.getByRole('link', { name: '1 of 9 badges' })).toBeInTheDocument()
  })

  it('starts on the level map', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Your path' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Warm-up: Add up the numbers/ })).toBeInTheDocument()
  })

  it('opens a topic straight from its URL', () => {
    window.location.hash = '#/topic/sum-demo'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Warm-up: Add up the numbers' })).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 9')).toBeInTheDocument()
  })

  it('shows a friendly page for unknown and not-yet-built topics', () => {
    window.location.hash = '#/topic/nope'
    const { unmount } = render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Nothing here yet' })).toBeInTheDocument()
    unmount()
    window.location.hash = '#/topic/binary-search'
    render(<App />)
    expect(screen.getByText(/still being built/i)).toBeInTheDocument()
  })

  it('goes from the map into a topic and back, moving focus to the new heading', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Your path' })).not.toHaveFocus()

    await user.click(screen.getByRole('link', { name: /Warm-up: Add up the numbers/ }))
    const topicHeading = await screen.findByRole('heading', { level: 1, name: 'Warm-up: Add up the numbers' })
    await waitFor(() => expect(topicHeading).toHaveFocus())
    expect(document.title).toBe('Warm-up: Add up the numbers · Stepwise')

    await user.click(screen.getByRole('link', { name: /back to the map/i }))
    const mapHeading = await screen.findByRole('heading', { level: 1, name: 'Your path' })
    await waitFor(() => expect(mapHeading).toHaveFocus())
    expect(document.title).toBe('Your path · Stepwise')
  })

  it('shows stars on the map after finishing a topic quiz', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/topic/sum-demo'
    render(<App />)
    const answers: Record<string, string> = {
      'What is total after the loop finishes for [2, 4, 6]?': '12',
      'How many times does the loop body run for [2, 4, 6]?': '3 times',
      'What does sum([]) return?': 'It returns 0',
    }
    for (const [question, answer] of Object.entries(answers)) {
      await user.click(within(screen.getByRole('group', { name: question })).getByRole('radio', { name: answer }))
    }
    await user.click(screen.getByRole('button', { name: 'Check answers' }))
    await user.click(screen.getByRole('link', { name: /back to the map/i }))

    const stage = await screen.findByRole('listitem', { name: /Warm-up/ })
    expect(within(stage).getByText('Completed')).toBeInTheDocument()
    expect(within(stage).getByRole('img', { name: '3 of 3 stars' })).toBeInTheDocument()
  })
})
