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

const seen: SavedState = { ...initialState(), help: { tourSeen: true } }
const duplicate = getEntry('has-duplicate')!
const duplicateStage = stages.find((s) => s.id === 'has-duplicate')!
const warmUp = getEntry('sum-demo')!
const warmUpStage = stages.find((s) => s.id === 'sum-demo')!

function ProgressProbe() {
  const { progress } = useProgress()
  return (
    <span data-testid="progress">
      {JSON.stringify({ runs: progress.runs, completed: progress.completed, streak: progress.streak.current })}
    </span>
  )
}
const probe = () => JSON.parse(screen.getByTestId('progress').textContent!)

const view = (entry = duplicate, stage = duplicateStage) =>
  renderWithProgress(
    <>
      <TopicPage stage={stage} entry={entry} />
      <ProgressProbe />
    </>,
    { state: seen },
  )

type User = ReturnType<typeof userEvent.setup>
const stepText = () => document.querySelector('.controls-step')?.textContent
const codeText = () => document.querySelector('.code-body')?.textContent ?? ''
const bug = (name: string) => screen.getByRole('button', { name })
const panel = () => screen.getByRole('region', { name: 'Common bugs' })
const next = (user: User) => user.click(screen.getByRole('button', { name: 'Next' }))
async function toTheEnd(user: User) {
  while (!/Step (\d+) of \1$/.test(stepText() ?? '')) await next(user)
}

describe('the Common bugs panel on the duplicate check page', () => {
  it('sits under the player, before the "Try your own" card, with three unpressed buttons', () => {
    view()
    const player = document.querySelector('.player')!
    const input = document.querySelector('.input-panel')!
    expect(player.compareDocumentPosition(panel()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(panel().compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    for (const label of ['.has on the array', 'i instead of items[i]', 'Never calling add']) {
      expect(bug(label)).toHaveAttribute('aria-pressed', 'false')
    }
    expect(screen.queryByRole('button', { name: 'Back to the correct version' })).not.toBeInTheDocument()
  })

  it('replays with the broken code, the bug marked pressed and the reason shown', async () => {
    const user = userEvent.setup()
    view()
    expect(stepText()).toBe('Step 1 of 31')
    await user.click(bug('.has on the array'))
    expect(bug('.has on the array')).toHaveAttribute('aria-pressed', 'true')
    expect(bug('Never calling add')).toHaveAttribute('aria-pressed', 'false')
    expect(stepText()).toBe('Step 1 of 4')
    expect(codeText()).toContain('if (items.has(item)) return true')
    expect(codeText()).not.toContain('hasDuplicateSlow')
    expect(within(panel()).getByText(/An array has no has method/)).toBeInTheDocument()
    // The default list has no repeat, so the run says it swapped in one.
    expect(screen.getByRole('status')).toHaveTextContent('A list with a repeat shows the bug: [3, 1, 3].')
  })

  it('each bug ends visibly wrong', async () => {
    const user = userEvent.setup()
    view()
    await user.click(bug('.has on the array'))
    await toTheEnd(user)
    expect(screen.getByRole('status')).toHaveTextContent('TypeError: items.has is not a function')

    await user.click(bug('i instead of items[i]'))
    expect(codeText()).toContain('if (i === j) return true')
    await toTheEnd(user)
    expect(screen.getByRole('status')).toHaveTextContent('so return false. But')
    expect(screen.getByRole('status')).toHaveTextContent('the right answer is true')

    await user.click(bug('Never calling add'))
    expect(codeText()).toContain('seen.add(item) is missing here')
    await toTheEnd(user)
    expect(screen.getByRole('status')).toHaveTextContent('the right answer is true')
  })

  it('has one role="status" on the page, even in a bug run', async () => {
    const user = userEvent.setup()
    view()
    await user.click(bug('Never calling add'))
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })

  it('runs a bug on the learner’s own list when it has a repeat', async () => {
    const user = userEvent.setup()
    view()
    const field = screen.getByRole('textbox', { name: 'List' })
    await user.clear(field)
    await user.type(field, '5, 2, 9, 2')
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await user.click(bug('i instead of items[i]'))
    expect(screen.getByRole('status')).toHaveTextContent('Call hasDuplicate with [5, 2, 9, 2], a list with a repeat.')
  })

  it('goes back to the correct version, from step 1, with both functions', async () => {
    const user = userEvent.setup()
    view()
    await user.click(bug('Never calling add'))
    await next(user)
    await next(user)
    await user.click(screen.getByRole('button', { name: 'Back to the correct version' }))
    expect(stepText()).toBe('Step 1 of 31')
    expect(codeText()).toContain('hasDuplicateSlow')
    expect(bug('Never calling add')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('button', { name: 'Back to the correct version' })).not.toBeInTheDocument()
  })

  it('starts the run over when switching bugs, or pressing the same one again', async () => {
    const user = userEvent.setup()
    view()
    await user.click(bug('i instead of items[i]'))
    await next(user)
    await next(user)
    expect(stepText()).toBe('Step 3 of 5')
    await user.click(bug('Never calling add'))
    expect(stepText()).toBe('Step 1 of 9')
    await next(user)
    await user.click(bug('Never calling add'))
    expect(stepText()).toBe('Step 1 of 9')
  })

  it('stops autoplay and clears the step when the bug changes', async () => {
    const user = userEvent.setup()
    view()
    await user.click(bug('Never calling add'))
    await user.click(screen.getByRole('button', { name: 'Play' }))
    await user.click(bug('i instead of items[i]'))
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(stepText()).toBe('Step 1 of 5')
  })

  it('does not count a finished bug run: no run, no stars, no streak', async () => {
    const user = userEvent.setup()
    view()
    for (const label of ['.has on the array', 'i instead of items[i]', 'Never calling add']) {
      await user.click(bug(label))
      await toTheEnd(user)
    }
    expect(probe()).toEqual({ runs: {}, completed: {}, streak: 0 })
  })

  it('still counts the correct run once the learner is back on it', async () => {
    const user = userEvent.setup()
    view()
    await user.click(bug('Never calling add'))
    await user.click(screen.getByRole('button', { name: 'Back to the correct version' }))
    await toTheEnd(user)
    expect(probe().runs).toEqual({ 'has-duplicate': true })
    expect(probe().streak).toBe(1)
  })

  it('has no predict switch in a bug run, and brings it back with the correct version', async () => {
    const user = userEvent.setup()
    view()
    expect(screen.getByRole('switch', { name: 'Predict mode' })).toBeInTheDocument()
    await user.click(bug('Never calling add'))
    expect(screen.queryByRole('switch', { name: 'Predict mode' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back to the correct version' }))
    expect(screen.getByRole('switch', { name: 'Predict mode' })).toBeInTheDocument()
  })

  it('never asks a question in a bug run even when predict mode is on', async () => {
    const user = userEvent.setup()
    view()
    await user.click(screen.getByRole('switch', { name: 'Predict mode' }))
    await user.click(bug('i instead of items[i]'))
    await toTheEnd(user)
    expect(screen.queryByRole('heading', { name: /How many (comparisons|lookups) will/ })).not.toBeInTheDocument()
    expect(stepText()).toBe('Step 5 of 5')
  })

  it('leaves bug mode when the learner applies their own list, and shows the correct version on it', async () => {
    const user = userEvent.setup()
    view()
    await user.click(bug('Never calling add'))
    const field = screen.getByRole('textbox', { name: 'List' })
    await user.clear(field)
    await user.type(field, '3, 1, 3')
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(bug('Never calling add')).toHaveAttribute('aria-pressed', 'false')
    expect(stepText()).toBe('Step 1 of 11')
    expect(codeText()).toContain('hasDuplicateSlow')
  })
})

describe('a topic without bugs', () => {
  it('shows no Common bugs panel', () => {
    view(warmUp, warmUpStage)
    expect(screen.queryByRole('region', { name: 'Common bugs' })).not.toBeInTheDocument()
    expect(screen.queryByText('Common bugs')).not.toBeInTheDocument()
    expect(stepText()).toBe('Step 1 of 9')
  })

  it('still counts a finished run', async () => {
    const user = userEvent.setup()
    view(warmUp, warmUpStage)
    await toTheEnd(user)
    expect(probe().runs).toEqual({ 'sum-demo': true })
  })
})
