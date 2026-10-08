import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { highlight } from '../engine/highlighter'
import { useProgress } from '../progress/ProgressContext'
import { initialState, type SavedState } from '../progress/state'
import { getEntry } from '../topics/registry'
import { stages } from '../topics/stages'
import { renderWithProgress } from '../test/renderWithProgress'
import { Badges } from './Badges'
import { Home } from './Home'
import { TopicPage } from './TopicPage'

vi.mock('../engine/highlighter', () => ({ highlight: vi.fn() }))

beforeEach(() => {
  vi.mocked(highlight).mockReturnValue(new Promise(() => {}))
})

const seen: SavedState = { ...initialState(), help: { tourSeen: true } }
const entry = getEntry('sum-demo')!

function Probe() {
  const { progress, requestTour } = useProgress()
  return (
    <>
      <span data-testid="seen">{String(progress.help.tourSeen)}</span>
      <button onClick={requestTour}>replay</button>
    </>
  )
}
const topic = () => (
  <>
    <TopicPage stage={stages[0]} entry={entry} />
    <Probe />
  </>
)
const tourDialog = () => screen.queryByRole('dialog', { name: /The picture|The code|The controls/ })

describe('the tour on the topic page', () => {
  it('starts by itself on the first visit', () => {
    renderWithProgress(topic())
    expect(screen.getByRole('dialog', { name: 'The picture' })).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
  })

  it('does not start once it has been seen', () => {
    renderWithProgress(topic(), { state: seen })
    expect(tourDialog()).not.toBeInTheDocument()
  })

  it('starts again when the learner asks to replay it', async () => {
    const user = userEvent.setup()
    renderWithProgress(topic(), { state: seen })
    expect(tourDialog()).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'replay' }))
    expect(screen.getByRole('dialog', { name: 'The picture' })).toBeInTheDocument()
  })

  it('remembers it was seen when it is finished, and does not return', async () => {
    const user = userEvent.setup()
    renderWithProgress(topic())
    expect(screen.getByTestId('seen')).toHaveTextContent('false')
    // The page has its own Next button too, so press the tour's.
    const next = () => within(screen.getByRole('dialog')).getByRole('button', { name: 'Next' })
    await user.click(next())
    await user.click(next())
    await user.click(next())
    await user.click(next())
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByTestId('seen')).toHaveTextContent('true')
    expect(tourDialog()).not.toBeInTheDocument()
  })

  it('ends with a reminder that the tour can be replayed from How to use', async () => {
    const user = userEvent.setup()
    renderWithProgress(topic())
    const next = () => within(screen.getByRole('dialog')).getByRole('button', { name: 'Next' })
    for (let i = 0; i < 4; i++) await user.click(next())
    const bubble = within(screen.getByRole('dialog'))
    expect(bubble.getByRole('heading', { name: 'Try your own numbers' })).toBeInTheDocument()
    expect(bubble.getByText(/replay this tour from How to use/i)).toBeInTheDocument()
  })

  it('remembers it was seen when it is skipped', async () => {
    const user = userEvent.setup()
    renderWithProgress(topic())
    await user.click(screen.getByRole('button', { name: 'Skip tour' }))
    expect(screen.getByTestId('seen')).toHaveTextContent('true')
    expect(tourDialog()).not.toBeInTheDocument()
  })

  it('does not count as seen if the learner leaves in the middle', () => {
    const { unmount } = renderWithProgress(topic())
    expect(tourDialog()).toBeInTheDocument()
    unmount()
    // Starting again from the same saved state: still not seen.
    renderWithProgress(topic())
    expect(screen.getByTestId('seen')).toHaveTextContent('false')
    expect(screen.getByRole('dialog', { name: 'The picture' })).toBeInTheDocument()
  })

  it('leaves the real player usable while it is open', async () => {
    const user = userEvent.setup()
    renderWithProgress(topic(), { state: initialState() })
    await user.click(screen.getByRole('button', { name: 'Play' }))
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
  })
})

describe('the tour stays off other pages', () => {
  it.each([
    ['the map', <Home key="h" />],
    ['the badges page', <Badges key="b" />],
  ])('does not start on %s', (_name, page) => {
    renderWithProgress(page, { state: initialState() })
    expect(tourDialog()).not.toBeInTheDocument()
  })
})
