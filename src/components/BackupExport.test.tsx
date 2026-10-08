import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { initialState, type SavedState } from '../progress/state'
import { parseBackup } from '../storage/backup'
import { renderWithProgress } from '../test/renderWithProgress'
import { BackupExport } from './BackupExport'

const state: SavedState = {
  ...initialState(),
  completed: { 'sum-demo': { stars: 3 } },
  badges: { 'first-quiz': '2026-10-07' },
}
const NOW = () => new Date(2026, 9, 8, 10, 0, 0)

function view(copy = vi.fn().mockResolvedValue(true)) {
  const download = vi.fn()
  renderWithProgress(<BackupExport download={download} copy={copy} now={NOW} />, { state })
  return { download, copy }
}

describe('BackupExport', () => {
  it('downloads a file named after today, with the progress inside', async () => {
    const user = userEvent.setup()
    const { download } = view()
    await user.click(screen.getByRole('button', { name: 'Download backup' }))
    expect(download).toHaveBeenCalledTimes(1)
    const [name, content] = download.mock.calls[0]
    expect(name).toBe('stepwise-progress-2026-10-08.json')
    expect(content).toContain('\n') // the file is readable
    const parsed = parseBackup(content)
    expect(parsed).toMatchObject({ ok: true })
    if (parsed.ok) expect(parsed.state).toEqual(state)
    expect(screen.getByText('Backup downloaded.')).toBeInTheDocument()
  })

  it('copies the backup as one line of text', async () => {
    const user = userEvent.setup()
    const { copy } = view()
    await user.click(screen.getByRole('button', { name: 'Copy backup' }))
    const text = copy.mock.calls[0][0] as string
    expect(text).not.toContain('\n')
    expect(parseBackup(text)).toMatchObject({ ok: true })
    expect(screen.getByText('Backup copied.')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows the text, selected, when the browser will not copy', async () => {
    const user = userEvent.setup()
    view(vi.fn().mockResolvedValue(false))
    await user.click(screen.getByRole('button', { name: 'Copy backup' }))
    expect(screen.getByText(/couldn.t copy automatically/i)).toBeInTheDocument()
    const box = screen.getByRole('textbox', { name: 'Backup text to copy by hand' }) as HTMLTextAreaElement
    expect(box).toHaveAttribute('readonly')
    expect(parseBackup(box.value)).toMatchObject({ ok: true })
    expect(box).toHaveFocus()
    expect(box.selectionEnd - box.selectionStart).toBe(box.value.length)
  })

  it('announces results in a polite live region that is always present, with no status role', () => {
    const { container } = renderWithProgress(<BackupExport now={NOW} />)
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
