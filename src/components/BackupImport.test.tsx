import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useProgress } from '../progress/ProgressContext'
import { initialState, type SavedState } from '../progress/state'
import { buildBackup, MAX_BACKUP_CHARS, serializeBackup } from '../storage/backup'
import { renderWithProgress } from '../test/renderWithProgress'
import { BackupImport } from './BackupImport'

const current: SavedState = {
  ...initialState(),
  completed: { 'sum-demo': { stars: 1 } },
  streak: { current: 1, longest: 2, lastStudyDay: '2026-10-08', freezeUsedWeek: null },
  badges: { 'first-run': '2026-10-06', 'first-quiz': '2026-10-06', 'streak-3': '2026-10-07' },
}
const restored: SavedState = {
  ...initialState(),
  completed: { 'sum-demo': { stars: 3 }, a: { stars: 2 }, b: { stars: 1 } },
  settings: { language: 'ts', speed: 2 },
  streak: { current: 0, longest: 5, lastStudyDay: '2026-09-01', freezeUsedWeek: null },
  badges: { 'first-run': '2026-09-01', 'first-quiz': '2026-09-02', 'perfect-score': '2026-09-02', 'streak-3': '2026-09-03' },
}
const backupText = (state = restored, when = new Date(2026, 9, 8, 12, 0)) => serializeBackup(buildBackup(state, when), 'text')

function Probe() {
  const { progress } = useProgress()
  return (
    <span data-testid="now">
      {Object.keys(progress.completed).length}|{progress.settings.language}|{progress.streak.longest}
    </span>
  )
}
const view = () =>
  renderWithProgress(
    <>
      <BackupImport />
      <Probe />
    </>,
    { state: current },
  )
const textbox = () => screen.getByRole('textbox', { name: 'Or paste your backup' })
const review = () => screen.getByRole('button', { name: 'Review backup' })
const reviewGroup = () => screen.getByRole('group', { name: 'Review backup' })
const unchanged = () => expect(screen.getByTestId('now')).toHaveTextContent('1|js|2')

async function paste(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(textbox())
  await user.paste(text)
  await user.click(review())
}

describe('BackupImport: first look', () => {
  it('offers a file picker, a paste box and a review button', () => {
    view()
    expect(screen.getByRole('heading', { level: 3, name: 'Restore from a backup' })).toBeInTheDocument()
    expect(screen.getByLabelText('Choose backup file')).toHaveAttribute('type', 'file')
    expect(textbox()).toBeInTheDocument()
    expect(review()).toBeInTheDocument()
  })

  it('has a polite live region that is always present, and no status role', () => {
    const { container } = view()
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('BackupImport: bad input changes nothing', () => {
  it('asks for something to review when the box is empty', async () => {
    const user = userEvent.setup()
    view()
    await user.click(review())
    expect(screen.getByText('Paste a backup or choose a file first.')).toBeInTheDocument()
    expect(textbox()).toHaveAttribute('aria-invalid', 'true')
    unchanged()
  })

  it.each([
    ['not a backup at all', '{oops', /isn.t a readable backup/],
    ['someone else’s JSON', JSON.stringify({ hello: 'world' }), /doesn.t look like a Stepwise backup/],
    ['a newer format', JSON.stringify({ app: 'stepwise', format: 2, data: {} }), /newer version of Stepwise.*Update the app/],
    ['damaged data', JSON.stringify({ app: 'stepwise', format: 1, data: { version: 1, completed: 5 } }), /damaged or incomplete/],
  ])('says what is wrong with %s', async (_label, input, message) => {
    const user = userEvent.setup()
    view()
    await paste(user, input)
    expect(screen.getByText(message)).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Review backup' })).not.toBeInTheDocument()
    unchanged()
  })

  it('clears the error after a good backup is reviewed', async () => {
    const user = userEvent.setup()
    view()
    await user.click(review())
    await user.click(textbox())
    await user.paste(backupText())
    await user.click(review())
    expect(screen.queryByText('Paste a backup or choose a file first.')).not.toBeInTheDocument()
    expect(textbox()).not.toHaveAttribute('aria-invalid', 'true')
  })
})

describe('BackupImport: review and confirm', () => {
  it('shows what the backup holds next to what it will replace, and nothing changes yet', async () => {
    const user = userEvent.setup()
    view()
    await paste(user, backupText())
    const group = reviewGroup()
    expect(group).toHaveTextContent('This backup was saved Oct 8, 2026.')
    expect(group).toHaveTextContent('It has 3 topics completed, a best streak of 5 days and 4 badges.')
    expect(group).toHaveTextContent('Right now you have 1 topic completed, a best streak of 2 days and 3 badges.')
    expect(group).toHaveTextContent('Replacing overwrites your current progress. Download a backup first to keep it.')
    unchanged()
  })

  it('handles a backup with no usable date', async () => {
    const user = userEvent.setup()
    view()
    const noDate = JSON.stringify({ ...JSON.parse(backupText()), exportedAt: 'whenever' })
    await paste(user, noDate)
    expect(reviewGroup()).toHaveTextContent('This backup has no save date.')
  })

  it('puts focus on the safe choice, Cancel', async () => {
    const user = userEvent.setup()
    view()
    await paste(user, backupText())
    expect(within(reviewGroup()).getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })

  it('replaces the progress when confirmed, says so, and closes the review', async () => {
    const user = userEvent.setup()
    view()
    await paste(user, backupText())
    await user.click(within(reviewGroup()).getByRole('button', { name: 'Replace my progress' }))
    expect(screen.getByTestId('now')).toHaveTextContent('3|ts|5')
    expect(screen.getByText('Progress restored.')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Review backup' })).not.toBeInTheDocument()
    expect(textbox()).toHaveValue('')
    expect(screen.getByRole('heading', { level: 3, name: 'Restore from a backup' })).toHaveFocus()
  })

  it('Cancel keeps everything as it was', async () => {
    const user = userEvent.setup()
    view()
    await paste(user, backupText())
    await user.click(within(reviewGroup()).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('group', { name: 'Review backup' })).not.toBeInTheDocument()
    expect(screen.queryByText('Progress restored.')).not.toBeInTheDocument()
    unchanged()
    expect(screen.getByRole('heading', { level: 3, name: 'Restore from a backup' })).toHaveFocus()
  })

  it('Escape cancels', async () => {
    const user = userEvent.setup()
    view()
    await paste(user, backupText())
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('group', { name: 'Review backup' })).not.toBeInTheDocument()
    unchanged()
  })
})

describe('BackupImport: files', () => {
  const file = (content: string, name = 'stepwise-progress.json') => new File([content], name, { type: 'application/json' })

  it('reviews a chosen file straight away', async () => {
    const user = userEvent.setup()
    view()
    await user.upload(screen.getByLabelText('Choose backup file'), file(backupText()))
    expect(await screen.findByRole('group', { name: 'Review backup' })).toHaveTextContent('3 topics completed')
    unchanged()
  })

  it('restores from a file when confirmed', async () => {
    const user = userEvent.setup()
    view()
    await user.upload(screen.getByLabelText('Choose backup file'), file(backupText()))
    await user.click(await screen.findByRole('button', { name: 'Replace my progress' }))
    expect(screen.getByTestId('now')).toHaveTextContent('3|ts|5')
  })

  it('rejects a file that is not a backup', async () => {
    const user = userEvent.setup()
    view()
    await user.upload(screen.getByLabelText('Choose backup file'), file('<html>nope</html>', 'page.json'))
    expect(await screen.findByText(/isn.t a readable backup/)).toBeInTheDocument()
    unchanged()
  })

  it('rejects a huge file without reading it', async () => {
    const user = userEvent.setup()
    view()
    await user.upload(screen.getByLabelText('Choose backup file'), file('x'.repeat(MAX_BACKUP_CHARS + 1)))
    expect(await screen.findByText(/too big to be a Stepwise backup/)).toBeInTheDocument()
    unchanged()
  })

  it('lets you pick the same file again after cancelling', async () => {
    const user = userEvent.setup()
    view()
    const picker = screen.getByLabelText('Choose backup file')
    const backup = file(backupText())
    await user.upload(picker, backup)
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))
    await user.upload(picker, backup)
    expect(await screen.findByRole('group', { name: 'Review backup' })).toBeInTheDocument()
  })
})
