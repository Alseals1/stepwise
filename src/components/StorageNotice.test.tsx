import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useProgress } from '../progress/ProgressContext'
import { renderWithProgress } from '../test/renderWithProgress'
import { StorageNotice } from './StorageNotice'

describe('StorageNotice', () => {
  it('stays hidden when progress can be saved', () => {
    const { container } = renderWithProgress(<StorageNotice />)
    expect(container).toBeEmptyDOMElement()
  })

  it('warns when the browser blocks storage', () => {
    renderWithProgress(<StorageNotice />, { available: false })
    expect(screen.getByText(/progress can.t be saved in this browser/i)).toBeInTheDocument()
  })

  it('warns when a save is refused', async () => {
    const user = userEvent.setup()
    function ChangeSpeed() {
      const { setSpeed } = useProgress()
      return <button onClick={() => setSpeed(2)}>change</button>
    }
    renderWithProgress(
      <>
        <ChangeSpeed />
        <StorageNotice />
      </>,
      { saveResult: false },
    )
    expect(screen.queryByText(/can.t be saved/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'change' }))
    expect(screen.getByText(/can.t be saved/i)).toBeInTheDocument()
  })
})
