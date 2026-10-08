import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../progress/ProgressContext'
import { renderWithProgress } from '../test/renderWithProgress'
import { Toasts, TOAST_MS } from './Toasts'

function Earn() {
  const { recordRun, completeTopic } = useProgress()
  return (
    <>
      <button onClick={() => recordRun('a')}>run</button>
      <button onClick={() => completeTopic('a', 3, 3)}>quiz</button>
    </>
  )
}
const view = () =>
  renderWithProgress(
    <>
      <Earn />
      <Toasts />
    </>,
  )

describe('Toasts', () => {
  it('has a polite live region that is always present, and no status role', () => {
    const { container } = view()
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('announces a newly unlocked badge with its description', async () => {
    const user = userEvent.setup()
    view()
    await user.click(screen.getByRole('button', { name: 'run' }))
    expect(screen.getByText('Badge unlocked: First Run')).toBeInTheDocument()
    expect(screen.getByText(/watched an algorithm run all the way through/)).toBeInTheDocument()
  })

  it('shows one toast per badge', async () => {
    const user = userEvent.setup()
    view()
    await user.click(screen.getByRole('button', { name: 'quiz' }))
    expect(screen.getByText('Badge unlocked: First Quiz')).toBeInTheDocument()
    expect(screen.getByText('Badge unlocked: Perfect Score')).toBeInTheDocument()
  })

  it('can be dismissed', async () => {
    const user = userEvent.setup()
    view()
    await user.click(screen.getByRole('button', { name: 'run' }))
    await user.click(screen.getByRole('button', { name: 'Dismiss First Run toast' }))
    expect(screen.queryByText('Badge unlocked: First Run')).not.toBeInTheDocument()
  })
})

describe('Toasts auto-hide', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  it('goes away by itself after a few seconds', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    view()
    await user.click(screen.getByRole('button', { name: 'run' }))
    expect(screen.getByText('Badge unlocked: First Run')).toBeInTheDocument()
    act(() => void vi.advanceTimersByTime(TOAST_MS - 100))
    expect(screen.getByText('Badge unlocked: First Run')).toBeInTheDocument()
    act(() => void vi.advanceTimersByTime(200))
    expect(screen.queryByText('Badge unlocked: First Run')).not.toBeInTheDocument()
  })
})
