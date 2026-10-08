import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Controls } from './Controls'
import type { Stepper } from './useStepper'

function makeStepper(overrides: Partial<Stepper> = {}): Stepper {
  return {
    index: 2,
    isPlaying: false,
    speed: 1,
    isFirst: false,
    isLast: false,
    pendingIndex: null,
    release: vi.fn(),
    next: vi.fn(),
    back: vi.fn(),
    restart: vi.fn(),
    togglePlay: vi.fn(),
    setSpeed: vi.fn(),
    ...overrides,
  }
}

describe('Controls: predict mode', () => {
  it('has no predict switch unless the topic has questions', () => {
    render(<Controls stepper={makeStepper()} frameCount={7} />)
    expect(screen.queryByRole('switch', { name: 'Predict mode' })).not.toBeInTheDocument()
  })

  it('shows the switch, reflects its state and reports changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<Controls stepper={makeStepper()} frameCount={7} predict={{ enabled: false, onChange }} />)
    const toggle = screen.getByRole('switch', { name: 'Predict mode' })
    expect(toggle).not.toBeChecked()
    await user.click(toggle)
    expect(onChange).toHaveBeenCalledWith(true)
    rerender(<Controls stepper={makeStepper()} frameCount={7} predict={{ enabled: true, onChange }} />)
    expect(screen.getByRole('switch', { name: 'Predict mode' })).toBeChecked()
  })

  it('marks the switch as a target for the tour', () => {
    render(<Controls stepper={makeStepper()} frameCount={7} predict={{ enabled: false, onChange: () => {} }} />)
    expect(document.querySelector('[data-tour="predict"]')).toContainElement(screen.getByRole('switch', { name: 'Predict mode' }))
  })

  it('disables Next and Play while a question is waiting, but not Back', () => {
    render(<Controls stepper={makeStepper({ pendingIndex: 3 })} frameCount={7} />)
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled()
  })

  it('shows how many predictions were right, on the last step only', () => {
    const score = { right: 3, total: 4 }
    const { rerender } = render(<Controls stepper={makeStepper({ index: 5 })} frameCount={7} score={score} />)
    expect(screen.queryByText(/you predicted/i)).not.toBeInTheDocument()
    rerender(<Controls stepper={makeStepper({ index: 6, isLast: true })} frameCount={7} score={score} />)
    expect(screen.getByText('You predicted 3 of 4.')).toBeInTheDocument()
  })

  it('says nothing about predictions when none were made', () => {
    render(<Controls stepper={makeStepper({ index: 6, isLast: true })} frameCount={7} score={{ right: 0, total: 0 }} />)
    expect(screen.queryByText(/you predicted/i)).not.toBeInTheDocument()
  })
})

describe('Controls', () => {
  it('shows which step you are on, counting from 1', () => {
    render(<Controls stepper={makeStepper()} frameCount={7} />)
    expect(screen.getByText('Step 3 of 7')).toBeInTheDocument()
  })

  it('shows a progress bar that matches the step', () => {
    render(<Controls stepper={makeStepper({ index: 2 })} frameCount={7} />)
    const bar = screen.getByRole('progressbar', { name: 'Step progress' })
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemax', '7')
    expect(bar).toHaveAttribute('aria-valuetext', 'Step 3 of 7')
  })

  it('shows "Run complete" only on the last step', () => {
    const { rerender } = render(<Controls stepper={makeStepper({ index: 5 })} frameCount={7} />)
    expect(screen.queryByText('Run complete')).not.toBeInTheDocument()
    rerender(<Controls stepper={makeStepper({ index: 6, isLast: true })} frameCount={7} />)
    expect(screen.getByText('Run complete')).toBeInTheDocument()
  })

  it('calls the matching stepper function for each button', async () => {
    const user = userEvent.setup()
    const stepper = makeStepper()
    render(<Controls stepper={stepper} frameCount={7} />)
    await user.click(screen.getByRole('button', { name: 'Restart' }))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await user.click(screen.getByRole('button', { name: 'Play' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(stepper.restart).toHaveBeenCalledTimes(1)
    expect(stepper.back).toHaveBeenCalledTimes(1)
    expect(stepper.togglePlay).toHaveBeenCalledTimes(1)
    expect(stepper.next).toHaveBeenCalledTimes(1)
  })

  it('shows Pause while playing', () => {
    render(<Controls stepper={makeStepper({ isPlaying: true })} frameCount={7} />)
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument()
  })

  it('disables Back and Restart on the first step, and Next on the last', () => {
    const { rerender } = render(<Controls stepper={makeStepper({ index: 0, isFirst: true })} frameCount={7} />)
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Restart' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    rerender(<Controls stepper={makeStepper({ index: 6, isLast: true })} frameCount={7} />)
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled()
  })

  it('has a speed slider from 0.5x to 4x that reports numbers', () => {
    const stepper = makeStepper({ speed: 2 })
    render(<Controls stepper={stepper} frameCount={7} />)
    const slider = screen.getByRole('slider', { name: 'Speed' })
    expect(slider).toHaveAttribute('min', '0.5')
    expect(slider).toHaveAttribute('max', '4')
    expect(slider).toHaveValue('2')
    expect(slider).toHaveAttribute('aria-valuetext', '2x')
    expect(screen.getByText('2x')).toBeInTheDocument()
    // <output> would add a second live region next to the narration.
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    fireEvent.change(slider, { target: { value: '3.5' } })
    expect(stepper.setSpeed).toHaveBeenCalledWith(3.5)
  })
})
