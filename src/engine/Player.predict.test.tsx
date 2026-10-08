import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sumDemo } from '../topics/sum-demo'
import { highlight } from './highlighter'
import { Player } from './Player'
import type { Frame } from './types'

vi.mock('./highlighter', () => ({ highlight: vi.fn() }))

const frames = sumDemo.record([2, 4, 6]) // asks at frames 3, 5, 7 and 8
const noAsks: Frame[] = frames.map((f) => ({ ...f, ask: undefined }))

beforeEach(() => {
  vi.mocked(highlight).mockReturnValue(new Promise(() => {}))
})

type User = ReturnType<typeof userEvent.setup>
const next = (user: User) => user.click(screen.getByRole('button', { name: 'Next' }))
const toggle = () => screen.getByRole('switch', { name: 'Predict mode' })
const stepText = () => document.querySelector('.controls-step')?.textContent
const question = () => screen.queryByRole('group', { name: /^What will/ })

async function turnOnAndReachFirstQuestion(user: User, props = {}) {
  render(<Player frames={frames} code={sumDemo.code} {...props} />)
  await user.click(toggle())
  await next(user) // frame 1
  await next(user) // frame 2
  await next(user) // frame 3 is asked about, so it waits
}

describe('Player predict mode: off', () => {
  it('has the switch off by default and never pauses for a question', async () => {
    const user = userEvent.setup()
    render(<Player frames={frames} code={sumDemo.code} />)
    expect(toggle()).not.toBeChecked()
    for (let i = 0; i < 8; i++) await next(user)
    expect(stepText()).toBe('Step 9 of 9')
    expect(question()).not.toBeInTheDocument()
  })

  it('has no switch at all when the topic asks no questions', () => {
    render(<Player frames={noAsks} code={sumDemo.code} />)
    expect(screen.queryByRole('switch', { name: 'Predict mode' })).not.toBeInTheDocument()
  })

  it('starts on when the saved setting says so, and reports changes', async () => {
    const user = userEvent.setup()
    const onPredictChange = vi.fn()
    render(<Player frames={frames} code={sumDemo.code} initialPredict onPredictChange={onPredictChange} />)
    expect(toggle()).toBeChecked()
    await user.click(toggle())
    expect(onPredictChange).toHaveBeenCalledWith(false)
  })
})

describe('Player predict mode: asking', () => {
  it('stops before the question frame, still showing the previous step', async () => {
    const user = userEvent.setup()
    await turnOnAndReachFirstQuestion(user)
    expect(question()).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What will total be after adding 2?' })).toHaveFocus()
    expect(stepText()).toBe('Step 3 of 9') // still frame 2
    expect(screen.getByRole('status')).toHaveTextContent('Pick up the next number, 2.') // not the answer's step
    expect(document.querySelector('[aria-current="step"]')).toHaveTextContent('for (const n of numbers)') // code not advanced
  })

  it('ignores Next and Play while the question waits', async () => {
    const user = userEvent.setup()
    await turnOnAndReachFirstQuestion(user)
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled()
    await user.keyboard('{ArrowRight} ')
    expect(stepText()).toBe('Step 3 of 9')
    expect(question()).toBeInTheDocument()
  })

  it('reveals the step and says Right! for a correct answer', async () => {
    const user = userEvent.setup()
    await turnOnAndReachFirstQuestion(user)
    await user.click(screen.getByRole('button', { name: '2' })) // the right answer is in position 0
    expect(stepText()).toBe('Step 4 of 9')
    expect(question()).not.toBeInTheDocument()
    expect(screen.getByText('Right!')).toBeInTheDocument()
    expect(screen.getByText('total was 0 and 2 is added, so it becomes 2.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Add 2 to the total, which is now 2.')
  })

  it('explains a wrong answer, names the right one and still reveals the step', async () => {
    const user = userEvent.setup()
    await turnOnAndReachFirstQuestion(user)
    await user.click(screen.getByRole('button', { name: '0' }))
    expect(stepText()).toBe('Step 4 of 9')
    expect(screen.getByText('Not quite. The answer was 2.')).toBeInTheDocument()
    expect(screen.getByText(/so it becomes 2/)).toBeInTheDocument()
  })

  it('moves focus to the feedback after answering', async () => {
    const user = userEvent.setup()
    await turnOnAndReachFirstQuestion(user)
    await user.click(screen.getByRole('button', { name: '0' }))
    expect(document.querySelector('.predict-feedback')).toHaveFocus()
  })

  it('lets the number keys pick an answer', async () => {
    const user = userEvent.setup()
    await turnOnAndReachFirstQuestion(user)
    await user.keyboard('1')
    expect(stepText()).toBe('Step 4 of 9')
    expect(screen.getByText('Right!')).toBeInTheDocument()
  })

  it('ignores number keys when no question is waiting', async () => {
    const user = userEvent.setup()
    render(<Player frames={frames} code={sumDemo.code} />)
    await user.keyboard('1')
    expect(stepText()).toBe('Step 1 of 9')
  })

  it('asks each question only once in a run, even after going Back and forward again', async () => {
    const user = userEvent.setup()
    await turnOnAndReachFirstQuestion(user)
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(stepText()).toBe('Step 3 of 9')
    expect(screen.queryByText(/Not quite/)).not.toBeInTheDocument() // the feedback belongs to its own step
    await next(user)
    expect(stepText()).toBe('Step 4 of 9')
    expect(question()).not.toBeInTheDocument()
    expect(screen.getByText('Not quite. The answer was 2.')).toBeInTheDocument()
  })

  it('does not steal focus when you merely revisit an answered step', async () => {
    const user = userEvent.setup()
    await turnOnAndReachFirstQuestion(user)
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await next(user)
    expect(document.querySelector('.predict-feedback')).not.toHaveFocus()
  })

  it('Back cancels a waiting question', async () => {
    const user = userEvent.setup()
    await turnOnAndReachFirstQuestion(user)
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(question()).not.toBeInTheDocument()
    expect(stepText()).toBe('Step 2 of 9')
  })

  it('turning predict mode off while a question waits reveals the step', async () => {
    const user = userEvent.setup()
    await turnOnAndReachFirstQuestion(user)
    await user.click(toggle())
    expect(question()).not.toBeInTheDocument()
    expect(stepText()).toBe('Step 4 of 9')
    expect(screen.queryByText(/Right!|Not quite/)).not.toBeInTheDocument()
  })

  it('does not ask about steps already passed when predict mode is switched on later', async () => {
    const user = userEvent.setup()
    render(<Player frames={frames} code={sumDemo.code} />)
    for (let i = 0; i < 4; i++) await next(user) // reach frame 4 with predict mode off
    await user.click(toggle())
    expect(question()).not.toBeInTheDocument()
    await next(user) // frame 5 is asked about
    expect(question()).toBeInTheDocument()
  })
})

describe('Player predict mode: autoplay', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  it('pauses at a question, and Play carries on after it is answered', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<Player frames={frames} code={sumDemo.code} initialPredict initialSpeed={4} />)
    await user.click(screen.getByRole('button', { name: 'Play' }))
    for (let i = 0; i < 4; i++) act(() => void vi.advanceTimersByTime(300))
    expect(question()).toBeInTheDocument()
    expect(stepText()).toBe('Step 3 of 9')
    act(() => void vi.advanceTimersByTime(5000))
    expect(stepText()).toBe('Step 3 of 9') // it waited

    await user.click(screen.getByRole('button', { name: '2' }))
    expect(stepText()).toBe('Step 4 of 9')
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument() // paused until Play is pressed
  })
})

describe('Player predict mode: score', () => {
  async function answerAllAsked(user: User, picks: string[]) {
    // The warm-up asks at frames 3, 5, 7 and 8; pick an answer each time one appears.
    for (let guess = 0; guess < picks.length; guess++) {
      for (let tries = 0; tries < 9 && !question(); tries++) {
        const nextButton = screen.getByRole('button', { name: 'Next' })
        if ((nextButton as HTMLButtonElement).disabled) break
        await user.click(nextButton)
      }
      const group = screen.getByRole('group', { name: /^What will/ })
      await user.click(within(group).getByRole('button', { name: picks[guess] }))
    }
  }

  it('shows how many predictions were right at the end of the run', async () => {
    const user = userEvent.setup()
    render(<Player frames={frames} code={sumDemo.code} initialPredict />)
    // Answers: frame 3 -> 2 (right), frame 5 -> 2 (wrong, right is 6), frame 7 -> 12 (right), frame 8 -> 3 (wrong)
    await answerAllAsked(user, ['2', '2', '12', '3'])
    expect(stepText()).toBe('Step 9 of 9')
    expect(screen.getByText('Run complete')).toBeInTheDocument()
    expect(screen.getByText('You predicted 2 of 4.')).toBeInTheDocument()
  })

  it('says nothing about predictions after a run without any', async () => {
    const user = userEvent.setup()
    render(<Player frames={frames} code={sumDemo.code} />)
    for (let i = 0; i < 8; i++) await next(user)
    expect(screen.getByText('Run complete')).toBeInTheDocument()
    expect(screen.queryByText(/you predicted/i)).not.toBeInTheDocument()
  })

  it('Restart gives a fresh run: the score is gone and the questions come back', async () => {
    const user = userEvent.setup()
    await turnOnAndReachFirstQuestion(user)
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: 'Restart' }))
    expect(screen.queryByText('Right!')).not.toBeInTheDocument()
    await next(user)
    await next(user)
    await next(user)
    expect(question()).toBeInTheDocument()
  })
})
