import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { QuizQuestion } from '../topics/types'
import { Quiz } from './Quiz'

const questions: QuizQuestion[] = [
  { question: 'First?', options: ['A1', 'B1', 'C1'], answer: 0, explain: 'Because one.' },
  { question: 'Second?', options: ['A2', 'B2', 'C2'], answer: 2, explain: 'Because two.' },
  { question: 'Third?', options: ['A3', 'B3', 'C3'], answer: 1, explain: 'Because three.' },
]

const group = (name: string) => screen.getByRole('group', { name })
const pick = (user: ReturnType<typeof userEvent.setup>, q: string, option: string) =>
  user.click(within(group(q)).getByRole('radio', { name: option }))
const checkButton = () => screen.getByRole('button', { name: 'Check answers' })

async function answerAll(user: ReturnType<typeof userEvent.setup>, choices: [string, string, string]) {
  await pick(user, 'First?', choices[0])
  await pick(user, 'Second?', choices[1])
  await pick(user, 'Third?', choices[2])
}

describe('Quiz', () => {
  it('shows every question as a group of radio options', () => {
    render(<Quiz questions={questions} onFinish={() => {}} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Check yourself' })).toBeInTheDocument()
    expect(within(group('Second?')).getAllByRole('radio')).toHaveLength(3)
  })

  it('keeps Check answers disabled until every question is answered', async () => {
    const user = userEvent.setup()
    render(<Quiz questions={questions} onFinish={() => {}} />)
    expect(checkButton()).toBeDisabled()
    await pick(user, 'First?', 'A1')
    await pick(user, 'Second?', 'C2')
    expect(checkButton()).toBeDisabled()
    await pick(user, 'Third?', 'B3')
    expect(checkButton()).toBeEnabled()
  })

  it('scores, explains each answer and reports the result once', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    render(<Quiz questions={questions} onFinish={onFinish} />)
    await answerAll(user, ['A1', 'A2', 'B3']) // right, wrong, right
    await user.click(checkButton())

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish).toHaveBeenCalledWith(2, 3)
    expect(screen.getByText('You got 2 of 3.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '2 of 3 stars' })).toBeInTheDocument()

    expect(within(group('First?')).getByText('Correct.')).toBeInTheDocument()
    expect(within(group('Second?')).getByText(/Not quite/)).toBeInTheDocument()
    expect(within(group('Second?')).getByText(/The answer is C2/)).toBeInTheDocument()
    expect(within(group('Second?')).getByText('Because two.')).toBeInTheDocument()
    expect(within(group('First?')).getAllByRole('radio').every((r) => (r as HTMLInputElement).disabled)).toBe(true)
  })

  it('gives 3 stars for a perfect score', async () => {
    const user = userEvent.setup()
    render(<Quiz questions={questions} onFinish={() => {}} />)
    await answerAll(user, ['A1', 'C2', 'B3'])
    await user.click(checkButton())
    expect(screen.getByRole('img', { name: '3 of 3 stars' })).toBeInTheDocument()
  })

  it('lets you try again with a clean slate and reports the new result', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    render(<Quiz questions={questions} onFinish={onFinish} />)
    await answerAll(user, ['B1', 'A2', 'A3'])
    await user.click(checkButton())
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.queryByText(/You got/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('radio').every((r) => !(r as HTMLInputElement).checked)).toBe(true)
    expect(checkButton()).toBeDisabled()

    await answerAll(user, ['A1', 'C2', 'B3'])
    await user.click(checkButton())
    expect(onFinish).toHaveBeenLastCalledWith(3, 3)
    expect(onFinish).toHaveBeenCalledTimes(2)
  })

  it('announces the result politely without adding a second status region', async () => {
    const user = userEvent.setup()
    const { container } = render(<Quiz questions={questions} onFinish={() => {}} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    const live = container.querySelector('[aria-live="polite"]')
    expect(live).toBeInTheDocument()
    expect(live).toBeEmptyDOMElement()
    await answerAll(user, ['A1', 'C2', 'B3'])
    await user.click(checkButton())
    expect(live).toHaveTextContent('You got 3 of 3.')
  })
})
