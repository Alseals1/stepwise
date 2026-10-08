import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useProgress } from '../progress/ProgressContext'
import { initialState } from '../progress/state'
import { renderWithProgress } from '../test/renderWithProgress'
import { YourData } from './YourData'

describe('YourData', () => {
  it('explains that progress lives in this browser and offers backup, restore and reset', () => {
    renderWithProgress(<YourData />)
    expect(screen.getByText(/saved in this browser only/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download backup' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy backup' })).toBeInTheDocument()
    expect(screen.getByLabelText('Choose backup file')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset progress' })).toBeInTheDocument()
  })

  it('leaves the title to the modal around it', () => {
    renderWithProgress(<YourData />)
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('keeps Reset progress working', async () => {
    const user = userEvent.setup()
    function Done() {
      return <span data-testid="done">{Object.keys(useProgress().progress.completed).length}</span>
    }
    renderWithProgress(
      <>
        <YourData />
        <Done />
      </>,
      { state: { ...initialState(), completed: { a: { stars: 3 } } } },
    )
    await user.click(screen.getByRole('button', { name: 'Reset progress' }))
    await user.click(screen.getByRole('button', { name: 'Yes, reset' }))
    expect(screen.getByTestId('done')).toHaveTextContent('0')
  })
})
