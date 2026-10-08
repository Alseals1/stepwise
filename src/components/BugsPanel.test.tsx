import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BugsPanel } from './BugsPanel'

const bugs = [
  { id: 'a', label: 'First mistake', why: 'The first one fails because of A.' },
  { id: 'b', label: 'Second mistake', why: 'The second one fails because of B.' },
  { id: 'c', label: 'Third mistake', why: 'The third one fails because of C.' },
]

function view(activeId: string | null = null) {
  const onSelect = vi.fn()
  const onBack = vi.fn()
  render(<BugsPanel bugs={bugs} activeId={activeId} onSelect={onSelect} onBack={onBack} />)
  return { onSelect, onBack }
}

describe('BugsPanel', () => {
  it('is a named region with one button per bug, none pressed at first', () => {
    view()
    expect(screen.getByRole('region', { name: 'Common bugs' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(3)
    for (const bug of bugs) expect(screen.getByRole('button', { name: bug.label })).toHaveAttribute('aria-pressed', 'false')
  })

  it('has no way back and no explanation until a bug is on', () => {
    view()
    expect(screen.queryByRole('button', { name: 'Back to the correct version' })).not.toBeInTheDocument()
    expect(screen.queryByText(/fails because/)).not.toBeInTheDocument()
  })

  it('marks only the active bug as pressed and shows why it goes wrong', () => {
    view('b')
    expect(screen.getByRole('button', { name: 'Second mistake' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'First mistake' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('The second one fails because of B.')).toBeInTheDocument()
  })

  it('announces the explanation politely, and is not a status (only the narration is)', () => {
    view('a')
    const why = screen.getByText('The first one fails because of A.').closest('[aria-live]')
    expect(why).toHaveAttribute('aria-live', 'polite')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('keeps its live region in the page before a bug is chosen, so the first message is announced', () => {
    view()
    expect(document.querySelector('.bugs-panel [aria-live="polite"]')).toBeInTheDocument()
  })

  it('reports the bug that was pressed, and going back', async () => {
    const user = userEvent.setup()
    const { onSelect, onBack } = view('a')
    await user.click(screen.getByRole('button', { name: 'Third mistake' }))
    expect(onSelect).toHaveBeenCalledWith('c')
    await user.click(screen.getByRole('button', { name: 'Back to the correct version' }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('works from the keyboard', async () => {
    const user = userEvent.setup()
    const { onSelect } = view()
    await user.tab()
    expect(screen.getByRole('button', { name: 'First mistake' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('a')
  })
})
