import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sumDemo } from '../topics/sum-demo'
import { highlight } from './highlighter'
import { Player } from './Player'

vi.mock('./highlighter', () => ({ highlight: vi.fn() }))

const frames = sumDemo.record([2, 4, 6])
const currentLine = () => document.querySelector('[aria-current="step"]')

beforeEach(() => {
  // Never resolves, so the panel keeps showing plain code (no act warnings).
  vi.mocked(highlight).mockReturnValue(new Promise(() => {}))
})

describe('Player', () => {
  it('starts on the first frame', () => {
    render(<Player frames={frames} code={sumDemo.code} />)
    expect(screen.getByRole('status')).toHaveTextContent('Call sum with [2, 4, 6].')
    expect(screen.getByText('Step 1 of 9')).toBeInTheDocument()
    expect(currentLine()).toHaveTextContent('function sum(numbers) {')
    expect(screen.getByRole('list', { name: 'Array' })).toBeInTheDocument()
  })

  it('steps forward and back, keeping narration, variables, code and counter in sync', async () => {
    const user = userEvent.setup()
    render(<Player frames={frames} code={sumDemo.code} />)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Step 3 of 9')).toBeInTheDocument()
    expect(currentLine()).toHaveTextContent('for (const n of numbers) {')
    expect(screen.getByRole('status')).toHaveTextContent('Pick up the next number, 2.')
    const variables = screen.getByRole('region', { name: 'Variables' })
    expect(within(variables).getByText('n')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Step 2 of 9')).toBeInTheDocument()
    expect(currentLine()).toHaveTextContent('let total = 0')
  })

  it('keeps the same current line when switching between JS and TS', async () => {
    const user = userEvent.setup()
    render(<Player frames={frames} code={sumDemo.code} />)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'TS' }))
    expect(screen.getByText(/numbers: number\[\]/)).toBeInTheDocument()
    expect(currentLine()).toHaveTextContent('for (const n of numbers) {')
    await user.click(screen.getByRole('button', { name: 'JS' }))
    expect(currentLine()).toHaveTextContent('for (const n of numbers) {')
  })

  it('responds to the keyboard shortcuts', async () => {
    const user = userEvent.setup()
    render(<Player frames={frames} code={sumDemo.code} />)
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
    expect(screen.getByText('Step 4 of 9')).toBeInTheDocument()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByText('Step 3 of 9')).toBeInTheDocument()
    await user.keyboard('r')
    expect(screen.getByText('Step 1 of 9')).toBeInTheDocument()
  })

  it('shows the last frame the same way the topic recorded it', async () => {
    const user = userEvent.setup()
    render(<Player frames={frames} code={sumDemo.code} />)
    for (let i = 0; i < frames.length - 1; i++) await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Step 9 of 9')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Every number is counted, so return 12.')
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })
})

describe('Player settings and run completion', () => {
  const nextButton = () => screen.getByRole('button', { name: 'Next' })
  const last = frames.length - 1

  it('reports a finished run when the last step is reached, not at mount', async () => {
    const user = userEvent.setup()
    const onRunComplete = vi.fn()
    render(<Player frames={frames} code={sumDemo.code} onRunComplete={onRunComplete} />)
    expect(onRunComplete).not.toHaveBeenCalled()
    for (let i = 0; i < last - 1; i++) await user.click(nextButton())
    expect(onRunComplete).not.toHaveBeenCalled()
    await user.click(nextButton())
    expect(onRunComplete).toHaveBeenCalledTimes(1)
  })

  it('reports each time the last step is entered again, but not while restarting', async () => {
    const user = userEvent.setup()
    const onRunComplete = vi.fn()
    render(<Player frames={frames} code={sumDemo.code} onRunComplete={onRunComplete} />)
    for (let i = 0; i < last; i++) await user.click(nextButton())
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await user.click(nextButton())
    expect(onRunComplete).toHaveBeenCalledTimes(2) // Back then Next re-enters the last step
    await user.click(screen.getByRole('button', { name: 'Restart' }))
    expect(onRunComplete).toHaveBeenCalledTimes(2)
    for (let i = 0; i < last; i++) await user.click(nextButton())
    expect(onRunComplete).toHaveBeenCalledTimes(3)
  })

  it('does not report for a one-frame run that is already "last" at mount', () => {
    const onRunComplete = vi.fn()
    render(<Player frames={frames.slice(0, 1)} code={sumDemo.code} onRunComplete={onRunComplete} />)
    expect(onRunComplete).not.toHaveBeenCalled()
  })

  it('starts in the given language and reports changes', async () => {
    const user = userEvent.setup()
    const onLanguageChange = vi.fn()
    render(<Player frames={frames} code={sumDemo.code} initialLanguage="ts" onLanguageChange={onLanguageChange} />)
    expect(screen.getByText(/numbers: number\[\]/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'JS' }))
    expect(onLanguageChange).toHaveBeenCalledWith('js')
  })

  it('starts at the given speed and reports changes', () => {
    const onSpeedChange = vi.fn()
    render(<Player frames={frames} code={sumDemo.code} initialSpeed={2} onSpeedChange={onSpeedChange} />)
    const slider = screen.getByRole('slider', { name: 'Speed' })
    expect(slider).toHaveValue('2')
    fireEvent.change(slider, { target: { value: '3' } })
    expect(onSpeedChange).toHaveBeenCalledWith(3)
  })
})

describe('Player tour targets', () => {
  it('marks the picture, the code and the controls so the tour can point at them', () => {
    render(<Player frames={frames} code={sumDemo.code} />)
    const picture = document.querySelector('[data-tour="picture"]')
    const code = document.querySelector('[data-tour="code"]')
    const controls = document.querySelector('[data-tour="controls"]')
    expect(picture).toContainElement(screen.getByRole('list', { name: 'Array' }))
    expect(code).toContainElement(screen.getByRole('button', { name: 'TS' }))
    expect(controls).toContainElement(screen.getByRole('button', { name: 'Next' }))
    // The Predict mode switch is a fourth target, present only when the topic has questions.
    expect(document.querySelector('[data-tour="predict"]')).toContainElement(
      screen.getByRole('switch', { name: 'Predict mode' }),
    )
    expect(document.querySelectorAll('[data-tour]')).toHaveLength(4)
  })
})
