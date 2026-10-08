import { render, screen, within } from '@testing-library/react'
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
