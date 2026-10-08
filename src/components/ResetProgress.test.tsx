import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useProgress } from '../progress/ProgressContext'
import { initialState } from '../progress/state'
import { renderWithProgress } from '../test/renderWithProgress'
import { ResetProgress } from './ResetProgress'

function Stars() {
  return <output data-testid="done">{Object.keys(useProgress().progress.completed).join(',')}</output>
}
const view = () =>
  renderWithProgress(
    <>
      <ResetProgress />
      <Stars />
    </>,
    { state: { ...initialState(), completed: { a: { stars: 3 } } } },
  )

describe('ResetProgress', () => {
  it('asks first, and nothing is reset yet', async () => {
    const user = userEvent.setup()
    view()
    await user.click(screen.getByRole('button', { name: 'Reset progress' }))
    const confirm = screen.getByRole('group', { name: 'Confirm reset' })
    expect(confirm).toHaveTextContent('Your settings stay.')
    expect(screen.getByTestId('done')).toHaveTextContent('a')
  })

  it('puts focus on the safe choice, Cancel', async () => {
    const user = userEvent.setup()
    view()
    await user.click(screen.getByRole('button', { name: 'Reset progress' }))
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })

  it('cancel changes nothing and returns focus to the Reset button', async () => {
    const user = userEvent.setup()
    view()
    await user.click(screen.getByRole('button', { name: 'Reset progress' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('group', { name: 'Confirm reset' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset progress' })).toHaveFocus()
    expect(screen.getByTestId('done')).toHaveTextContent('a')
  })

  it('confirming resets progress and returns focus to the Reset button', async () => {
    const user = userEvent.setup()
    view()
    await user.click(screen.getByRole('button', { name: 'Reset progress' }))
    await user.click(screen.getByRole('button', { name: 'Yes, reset' }))
    expect(screen.getByTestId('done')).toBeEmptyDOMElement()
    expect(screen.queryByRole('group', { name: 'Confirm reset' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset progress' })).toHaveFocus()
  })

  it('Escape cancels', async () => {
    const user = userEvent.setup()
    view()
    await user.click(screen.getByRole('button', { name: 'Reset progress' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('group', { name: 'Confirm reset' })).not.toBeInTheDocument()
  })
})
