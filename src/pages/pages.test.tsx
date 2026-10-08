import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { highlight } from '../engine/highlighter'
import { ProgressProvider, useProgress } from '../progress/ProgressContext'
import { initialState } from '../progress/state'
import { save } from '../storage/storage'
import { markTourSeenInStorage } from '../test/tour'
import { renderWithProgress } from '../test/renderWithProgress'
import { getEntry } from '../topics/registry'
import { stages } from '../topics/stages'
import { Home } from './Home'
import { Locked } from './Locked'
import { NotFound } from './NotFound'
import { TopicPage } from './TopicPage'

vi.mock('../engine/highlighter', () => ({ highlight: vi.fn() }))

beforeEach(() => {
  vi.mocked(highlight).mockReturnValue(new Promise(() => {}))
  document.title = ''
  markTourSeenInStorage()
})

describe('NotFound', () => {
  it('explains an unknown page and links back to the map', () => {
    render(<NotFound reason="unknown" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Nothing here yet' })).toBeInTheDocument()
    expect(screen.getByText(/couldn.t find that page/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to the map/i })).toHaveAttribute('href', '#/')
    expect(document.title).toBe('Nothing here yet · Stepwise')
  })

  it('explains a topic that is still being built', () => {
    render(<NotFound reason="not-built" />)
    expect(screen.getByText(/still being built/i)).toBeInTheDocument()
  })
})

describe('Locked', () => {
  it('names what to finish first and mentions the unlock switch', () => {
    render(<Locked blockedBy="Warm-up" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Locked' })).toBeInTheDocument()
    expect(screen.getByText(/Finish Warm-up to unlock this topic/)).toBeInTheDocument()
    expect(screen.getByText(/Unlock all topics/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to the map/i })).toHaveAttribute('href', '#/')
    expect(document.title).toBe('Locked · Stepwise')
  })
})

describe('Home', () => {
  it('shows the map with every stage', () => {
    render(
      <ProgressProvider>
        <Home />
      </ProgressProvider>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Your path' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(stages.length)
    expect(document.title).toBe('Your path · Stepwise')
  })

  it('shows the streak panel, and keeps the backup and reset tools out of the page', () => {
    renderWithProgress(<Home />)
    expect(screen.getByRole('region', { name: 'Streak' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Your data' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reset progress' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Download backup' })).not.toBeInTheDocument()
  })

  it('warns when progress cannot be saved, and only then', () => {
    const { unmount } = renderWithProgress(<Home />)
    expect(screen.queryByText(/can.t be saved/i)).not.toBeInTheDocument()
    unmount()
    renderWithProgress(<Home />, { available: false })
    expect(screen.getByText(/can.t be saved/i)).toBeInTheDocument()
  })

  it('flips the unlock switch', async () => {
    const user = userEvent.setup()
    render(
      <ProgressProvider>
        <Home />
      </ProgressProvider>,
    )
    const toggle = screen.getByRole('switch', { name: 'Unlock all topics' })
    expect(toggle).not.toBeChecked()
    await user.click(toggle)
    expect(toggle).toBeChecked()
  })
})

describe('TopicPage', () => {
  const stage = stages[0]
  const entry = getEntry('sum-demo')!

  function Probe() {
    return <output data-testid="progress">{JSON.stringify(useProgress().progress.completed)}</output>
  }
  const renderPage = () =>
    render(
      <ProgressProvider>
        <TopicPage stage={stage} entry={entry} />
        <Probe />
      </ProgressProvider>,
    )

  it('shows the title, a way back, and the one-sentence summary', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: stage.title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to the map/i })).toHaveAttribute('href', '#/')
    expect(screen.getByText(entry.content.whatItDoes)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Difficulty: easy' })).toBeInTheDocument()
    expect(document.title).toBe(`${stage.title} · Stepwise`)
  })

  it('shows the sections in order: analogy, player, Big O, quiz', () => {
    renderPage()
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(['Analogy', 'Variables', 'Big O', 'Check yourself'])
    expect(screen.getByText('Step 1 of 9')).toBeInTheDocument()
  })

  it('hides the watch-first block when the topic has no video', () => {
    renderPage()
    expect(screen.queryByText('Watch first')).not.toBeInTheDocument()
  })

  it('links the source in a new tab', () => {
    renderPage()
    const source = screen.getByRole('link', { name: new RegExp(entry.content.source.label) })
    expect(source).toHaveAttribute('href', entry.content.source.url)
    expect(source).toHaveAttribute('target', '_blank')
  })

  it('records a finished run when the animation reaches its last step', async () => {
    const user = userEvent.setup()
    function RunsProbe() {
      return <output data-testid="runs">{JSON.stringify(useProgress().progress.runs)}</output>
    }
    render(
      <ProgressProvider>
        <TopicPage stage={stage} entry={entry} />
        <RunsProbe />
      </ProgressProvider>,
    )
    expect(screen.getByTestId('runs')).toHaveTextContent('{}')
    for (let i = 0; i < entry.frames.length - 1; i++) await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByTestId('runs')).toHaveTextContent('{"sum-demo":true}')
  })

  it('starts in the saved language and speed, and remembers changes', async () => {
    const user = userEvent.setup()
    save({ ...initialState(), settings: { language: 'ts', speed: 2 }, help: { tourSeen: true } })
    function SettingsProbe() {
      return <output data-testid="settings">{JSON.stringify(useProgress().progress.settings)}</output>
    }
    render(
      <ProgressProvider>
        <TopicPage stage={stage} entry={entry} />
        <SettingsProbe />
      </ProgressProvider>,
    )
    expect(screen.getByText(/numbers: number\[\]/)).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Speed' })).toHaveValue('2')
    await user.click(screen.getByRole('button', { name: 'JS' }))
    expect(screen.getByTestId('settings')).toHaveTextContent('"language":"js"')
  })

  it('completes the topic with stars when the quiz is checked', async () => {
    const user = userEvent.setup()
    renderPage()
    expect(screen.getByTestId('progress')).toHaveTextContent('{}')
    for (const q of entry.content.quiz) {
      const group = screen.getByRole('group', { name: q.question })
      await user.click(within(group).getByRole('radio', { name: q.options[q.answer] }))
    }
    await user.click(screen.getByRole('button', { name: 'Check answers' }))
    expect(screen.getByTestId('progress')).toHaveTextContent('{"sum-demo":{"stars":3}}')
  })
})
