import { describe, expect, it } from 'vitest'
import { recordResult, stageStates, type Progress } from '../progress/progress'
import type { TopicEntry } from '../topics/registry'
import type { StageInfo } from '../topics/types'
import { resolvePage } from './resolvePage'

const stage = (id: string, available = true): StageInfo => ({ id, title: `T-${id}`, blurb: '', difficulty: 1, available })
const stages = [stage('a'), stage('b'), stage('c', false)]
const empty: Progress = { completed: {}, unlockAll: false }
const entry = (id: string) => ({ id }) as TopicEntry
const lookup = (id: string) => (id === 'a' || id === 'b' ? entry(id) : undefined)
const resolve = (route: Parameters<typeof resolvePage>[0], progress = empty) =>
  resolvePage(route, stageStates(stages, progress), lookup)

describe('resolvePage', () => {
  it('shows the home page', () => {
    expect(resolve({ name: 'home' })).toEqual({ page: 'home' })
  })

  it('shows not found for an unknown route or an unknown topic id', () => {
    expect(resolve({ name: 'not-found' })).toEqual({ page: 'not-found', reason: 'unknown' })
    expect(resolve({ name: 'topic', id: 'zzz' })).toEqual({ page: 'not-found', reason: 'unknown' })
  })

  it('says a planned topic is not built yet', () => {
    expect(resolve({ name: 'topic', id: 'c' })).toEqual({ page: 'not-found', reason: 'not-built' })
  })

  it('opens an open topic with its entry', () => {
    const result = resolve({ name: 'topic', id: 'a' })
    expect(result).toMatchObject({ page: 'topic', entry: { id: 'a' }, state: { stage: { id: 'a' } } })
  })

  it('shows the lock page for a locked topic, naming what to finish', () => {
    const result = resolve({ name: 'topic', id: 'b' })
    expect(result).toMatchObject({ page: 'locked', state: { blockedBy: 'T-a' } })
  })

  it('opens that topic once the previous one is completed, or with unlock all', () => {
    expect(resolve({ name: 'topic', id: 'b' }, recordResult(empty, 'a', 3, 3)).page).toBe('topic')
    expect(resolve({ name: 'topic', id: 'b' }, { ...empty, unlockAll: true }).page).toBe('topic')
  })

  it('still opens a completed topic for another go', () => {
    expect(resolve({ name: 'topic', id: 'a' }, recordResult(empty, 'a', 3, 3)).page).toBe('topic')
  })

  it('treats a built stage with no registered topic as not built', () => {
    const noEntry = resolvePage({ name: 'topic', id: 'a' }, stageStates(stages, empty), () => undefined)
    expect(noEntry).toEqual({ page: 'not-found', reason: 'not-built' })
  })
})
