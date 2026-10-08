import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { recordResult, stageStates, type Progress } from '../progress/progress'
import type { StageInfo } from '../topics/types'
import { LevelMap } from './LevelMap'

const stage = (id: string, available = true): StageInfo => ({
  id,
  title: `Stage ${id}`,
  blurb: `Blurb ${id}`,
  difficulty: 2,
  available,
})
const empty: Progress = { completed: {}, unlockAll: false }
const stages = [stage('a'), stage('b'), stage('c', false)]

function renderMap(progress: Progress = empty, onUnlockAll = vi.fn()) {
  render(<LevelMap states={stageStates(stages, progress)} unlockAll={progress.unlockAll} onUnlockAll={onUnlockAll} />)
  return onUnlockAll
}
const item = (id: string) => screen.getByRole('listitem', { name: new RegExp(`Stage ${id}`) })

describe('LevelMap', () => {
  it('lists every stage in order', () => {
    renderMap()
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(titles).toEqual(['Stage a', 'Stage b', 'Stage c'])
  })

  it('links an open stage and marks the next one to play', () => {
    renderMap()
    const open = item('a')
    expect(within(open).getByRole('link')).toHaveAttribute('href', '#/topic/a')
    expect(open).toHaveTextContent('Open')
    expect(within(open).getByText('Next up')).toBeInTheDocument()
    expect(screen.getAllByText('Next up')).toHaveLength(1)
  })

  it('shows a locked stage as text only, saying what to finish first', () => {
    renderMap()
    const locked = item('b')
    expect(within(locked).queryByRole('link')).not.toBeInTheDocument()
    expect(locked).toHaveTextContent('Locked')
    expect(locked).toHaveTextContent('Finish Stage a to unlock')
  })

  it('shows a planned stage as coming soon, not clickable', () => {
    renderMap()
    const soon = item('c')
    expect(within(soon).queryByRole('link')).not.toBeInTheDocument()
    expect(soon).toHaveTextContent('Coming soon')
  })

  it('shows a completed stage with its stars and still links to it', () => {
    renderMap(recordResult(empty, 'a', 2, 3))
    const done = item('a')
    expect(done).toHaveTextContent('Completed')
    expect(within(done).getByRole('img', { name: '2 of 3 stars' })).toBeInTheDocument()
    expect(within(done).getByRole('link')).toBeInTheDocument()
    expect(within(done).queryByText('Next up')).not.toBeInTheDocument()
    expect(within(item('b')).getByText('Next up')).toBeInTheDocument()
  })

  it('shows each stage difficulty', () => {
    renderMap()
    expect(within(item('a')).getByRole('img', { name: 'Difficulty: medium' })).toBeInTheDocument()
  })

  it('has an Unlock all topics switch that reports changes', async () => {
    const user = userEvent.setup()
    const onUnlockAll = renderMap()
    const toggle = screen.getByRole('switch', { name: 'Unlock all topics' })
    expect(toggle).not.toBeChecked()
    await user.click(toggle)
    expect(onUnlockAll).toHaveBeenCalledWith(true)
  })

  it('reflects unlock all: the locked stage becomes a link', () => {
    renderMap({ completed: {}, unlockAll: true })
    expect(screen.getByRole('switch', { name: 'Unlock all topics' })).toBeChecked()
    expect(within(item('b')).getByRole('link')).toHaveAttribute('href', '#/topic/b')
  })
})
