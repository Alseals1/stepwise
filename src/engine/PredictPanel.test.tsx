import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PredictFeedback, PredictPanel } from './PredictPanel'
import type { Ask } from './types'

const ask: Ask = {
  question: 'What will total be after adding 4?',
  options: ['2', '6', '4'],
  answer: 1,
  explain: 'total was 2 and 4 is added, so it becomes 6.',
}

describe('PredictPanel', () => {
  it('asks the question, labelled as a group of answers, with focus on the question', () => {
    render(<PredictPanel ask={ask} onChoose={() => {}} />)
    expect(screen.getByRole('heading', { name: ask.question })).toHaveFocus()
    const group = screen.getByRole('group', { name: ask.question })
    expect(within(group).getAllByRole('button')).toHaveLength(3)
  })

  it('shows each answer as a button, and reports which one was picked (counting from 0)', async () => {
    const user = userEvent.setup()
    const onChoose = vi.fn()
    render(<PredictPanel ask={ask} onChoose={onChoose} />)
    await user.click(screen.getByRole('button', { name: '6' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    expect(onChoose.mock.calls).toEqual([[1], [0]])
  })

  it('tells people the number keys that pick an answer, matching how many there are', () => {
    const { rerender } = render(<PredictPanel ask={ask} onChoose={() => {}} />)
    expect(screen.getByText(/press 1 – 3/i)).toBeInTheDocument()
    rerender(<PredictPanel ask={{ ...ask, options: ['a', 'b'], answer: 0 }} onChoose={() => {}} />)
    expect(screen.getByText(/press 1 – 2/i)).toBeInTheDocument()
  })

  it('does not spoil the answer', () => {
    render(<PredictPanel ask={ask} onChoose={() => {}} />)
    expect(screen.queryByText(ask.explain)).not.toBeInTheDocument()
    expect(screen.queryByText(/right|wrong|not quite/i)).not.toBeInTheDocument()
  })
})

describe('PredictFeedback', () => {
  it('celebrates a right answer and explains why', () => {
    render(<PredictFeedback ask={ask} chosen={1} />)
    expect(screen.getByText('Right!')).toBeInTheDocument()
    expect(screen.getByText(ask.explain)).toBeInTheDocument()
    expect(document.querySelector('[data-result="right"]')).toBeInTheDocument()
  })

  it('names the right answer when the guess was wrong, and explains why', () => {
    render(<PredictFeedback ask={ask} chosen={0} />)
    expect(screen.getByText('Not quite. The answer was 6.')).toBeInTheDocument()
    expect(screen.getByText(ask.explain)).toBeInTheDocument()
    expect(document.querySelector('[data-result="wrong"]')).toBeInTheDocument()
  })

  it('takes focus so a screen reader reads it', () => {
    render(<PredictFeedback ask={ask} chosen={0} />)
    expect(document.querySelector('.predict-feedback')).toHaveFocus()
  })

  it('leaves focus alone when told this is only a revisit', () => {
    render(<PredictFeedback ask={ask} chosen={0} focus={false} />)
    expect(document.querySelector('.predict-feedback')).not.toHaveFocus()
  })
})
