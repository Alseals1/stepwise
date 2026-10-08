import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'

function Harness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open it</button>
      <button onClick={() => setOpen(false)}>Close from outside</button>
      <Dialog
        open={open}
        title="Your data"
        onClose={() => {
          onClose()
          setOpen(false)
        }}
      >
        <button>Inside</button>
      </Dialog>
    </>
  )
}
const dialog = () => document.querySelector('dialog') as HTMLDialogElement

describe('Dialog', () => {
  it('is hidden, with no content mounted, while closed', () => {
    render(<Harness />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Inside' })).not.toBeInTheDocument()
    expect(dialog()).not.toHaveAttribute('open')
  })

  it('opens as a dialog named by its title, with the content inside', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Open it' }))
    const open = screen.getByRole('dialog', { name: 'Your data' })
    expect(open).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Your data' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Inside' })).toBeInTheDocument()
  })

  it('puts focus on the title when it opens and returns it to the opener when it closes', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Open it' })
    await user.click(opener)
    expect(screen.getByRole('heading', { name: 'Your data' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(opener).toHaveFocus()
  })

  it('closes with the Close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Open it' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes when the browser closes it itself (the Escape key)', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Open it' }))
    act(() => dialog().close())
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes when the dimmed area behind it is clicked, but not when the content is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Open it' }))
    await user.click(screen.getByRole('button', { name: 'Inside' }))
    await user.click(screen.getByRole('heading', { name: 'Your data' }))
    expect(onClose).not.toHaveBeenCalled()
    await user.click(dialog()) // the backdrop reports the dialog element itself as the target
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when the parent is the one closing it', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Open it' }))
    act(() => screen.getByRole('button', { name: 'Close from outside' }).click())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('starts clean each time: content is unmounted while closed', async () => {
    const user = userEvent.setup()
    function Counter() {
      const [n, setN] = useState(0)
      return <button onClick={() => setN(n + 1)}>clicks {n}</button>
    }
    function Wrapper() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button onClick={() => setOpen(true)}>open</button>
          <Dialog open={open} title="T" onClose={() => setOpen(false)}>
            <Counter />
          </Dialog>
        </>
      )
    }
    render(<Wrapper />)
    await user.click(screen.getByRole('button', { name: 'open' }))
    await user.click(screen.getByRole('button', { name: 'clicks 0' }))
    expect(screen.getByRole('button', { name: 'clicks 1' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await user.click(screen.getByRole('button', { name: 'open' }))
    expect(screen.getByRole('button', { name: 'clicks 0' })).toBeInTheDocument()
  })
})
