import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { highlight } from '../engine/highlighter'
import { useProgress } from '../progress/ProgressContext'
import { initialState, type SavedState } from '../progress/state'
import { renderWithProgress } from '../test/renderWithProgress'
import { getEntry } from '../topics/registry'
import { stages } from '../topics/stages'
import { TopicPage } from './TopicPage'

vi.mock('../engine/highlighter', () => ({ highlight: vi.fn() }))

beforeEach(() => {
  vi.mocked(highlight).mockReturnValue(new Promise(() => {}))
})

const base = initialState()
const seen: SavedState = { ...base, help: { tourSeen: true } }
const entry = getEntry('sum-demo')!

function RunsProbe() {
  return <span data-testid="runs">{JSON.stringify(useProgress().progress.runs)}</span>
}
const page = () => (
  <>
    <TopicPage stage={stages[0]} entry={entry} />
    <RunsProbe />
  </>
)
const view = (state = seen) => renderWithProgress(page(), { state })

type User = ReturnType<typeof userEvent.setup>
const field = () => screen.getByRole('textbox', { name: 'Numbers' })
const stepText = () => document.querySelector('.controls-step')?.textContent
const next = (user: User) => user.click(screen.getByRole('button', { name: 'Next' }))
const arrayBoxes = () =>
  within(screen.getByRole('list', { name: 'Array' }))
    .getAllByRole('listitem')
    .map((li) => li.querySelector('.box-value')?.textContent)

async function apply(user: User, text: string) {
  await user.clear(field())
  if (text) await user.type(field(), text)
  await user.click(screen.getByRole('button', { name: 'Apply' }))
}

describe('custom input on the topic page', () => {
  it('shows the card with the example, and runs the example at first', () => {
    view()
    expect(screen.getByRole('heading', { level: 2, name: 'Try your own numbers' })).toBeInTheDocument()
    expect(field()).toHaveValue('2, 4, 6')
    expect(stepText()).toBe('Step 1 of 9')
    expect(arrayBoxes()).toEqual(['2', '4', '6'])
  })

  it('runs the learner’s numbers: new length, new boxes, new narration', async () => {
    const user = userEvent.setup()
    view()
    await apply(user, '5, 10')
    expect(stepText()).toBe('Step 1 of 7')
    expect(arrayBoxes()).toEqual(['5', '10'])
    expect(screen.getByRole('status')).toHaveTextContent('Call sum with [5, 10].')
  })

  it('starts over from step 1, whatever step the old run was on', async () => {
    const user = userEvent.setup()
    view()
    await next(user)
    await next(user)
    await next(user)
    expect(stepText()).toBe('Step 4 of 9')
    await apply(user, '1, 2, 3, 4')
    expect(stepText()).toBe('Step 1 of 11')
  })

  it('stops autoplay when new numbers are applied', async () => {
    const user = userEvent.setup()
    view()
    await user.click(screen.getByRole('button', { name: 'Play' }))
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    await apply(user, '3')
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(stepText()).toBe('Step 1 of 5')
  })

  it('keeps the language, speed and Predict mode choices', async () => {
    const user = userEvent.setup()
    view()
    await user.click(screen.getByRole('button', { name: 'TS' }))
    await user.click(screen.getByRole('switch', { name: 'Predict mode' }))
    await apply(user, '9, 9')
    expect(screen.getByRole('button', { name: 'TS' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('switch', { name: 'Predict mode' })).toBeChecked()
  })

  it('throws away a waiting question, the answers and the score from the old run', async () => {
    const user = userEvent.setup()
    view({ ...seen, settings: { ...seen.settings, predictMode: true } })
    for (let i = 0; i < 3; i++) await next(user)
    expect(screen.getByRole('group', { name: /^What will total be after adding 2\?/ })).toBeInTheDocument()
    await apply(user, '8')
    expect(screen.queryByRole('group', { name: /^What will/ })).not.toBeInTheDocument()
    expect(stepText()).toBe('Step 1 of 5')
  })

  it('asks the questions about the new numbers', async () => {
    const user = userEvent.setup()
    view({ ...seen, settings: { ...seen.settings, predictMode: true } })
    await apply(user, '8, 3')
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { name: 'What will total be after adding 8?' })).toBeInTheDocument()
  })

  it('leaves the current run untouched when the input is refused', async () => {
    const user = userEvent.setup()
    view()
    await next(user)
    await next(user)
    await apply(user, '1, 2, 1000')
    expect(screen.getByText(/between -99 and 99/)).toBeInTheDocument()
    expect(stepText()).toBe('Step 3 of 9')
    expect(arrayBoxes()).toEqual(['2', '4', '6'])
  })

  it('Random runs a fresh example, and Reset brings back the built-in one', async () => {
    const user = userEvent.setup()
    view()
    await user.click(screen.getByRole('button', { name: 'Random' }))
    expect(field().getAttribute('value')).not.toBe('')
    expect(stepText()).toMatch(/^Step 1 of \d+$/)
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(field()).toHaveValue('2, 4, 6')
    expect(stepText()).toBe('Step 1 of 9')
  })

  it('does not let the player shortcuts act while the learner is typing', async () => {
    const user = userEvent.setup()
    view()
    await next(user)
    await next(user)
    await user.click(field())
    await user.keyboard('r1 {ArrowLeft}{ArrowRight}')
    expect(stepText()).toBe('Step 3 of 9')
  })

  it('still counts a finished run on the learner’s own numbers', async () => {
    const user = userEvent.setup()
    view()
    await apply(user, '7')
    expect(screen.getByTestId('runs')).toHaveTextContent('{}')
    for (let i = 0; i < 4; i++) await next(user)
    expect(stepText()).toBe('Step 5 of 5')
    expect(screen.getByTestId('runs')).toHaveTextContent('{"sum-demo":true}')
  })

  it('does not remember the numbers: coming back shows the example again', async () => {
    const user = userEvent.setup()
    const first = view()
    await apply(user, '4, 4')
    first.unmount()
    view()
    expect(field()).toHaveValue('2, 4, 6')
    expect(stepText()).toBe('Step 1 of 9')
  })
})
