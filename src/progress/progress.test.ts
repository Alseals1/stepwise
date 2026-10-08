import { describe, expect, it } from 'vitest'
import type { StageInfo } from '../topics/types'
import { recordResult, stageStates, starsFor, type Progress } from './progress'

const stage = (id: string, available = true): StageInfo => ({
  id,
  title: `Title ${id}`,
  blurb: '',
  difficulty: 1,
  available,
})
const empty: Progress = { completed: {}, unlockAll: false }

describe('starsFor', () => {
  it.each([
    [3, 3, 3],
    [2, 3, 2],
    [1, 2, 2],
    [1, 3, 1],
    [0, 3, 1],
    [0, 0, 1],
  ])('%i correct of %i gives %i stars', (correct, total, stars) => {
    expect(starsFor(correct, total)).toBe(stars)
  })
})

describe('recordResult', () => {
  it('completes the topic with stars', () => {
    expect(recordResult(empty, 'a', 2, 3).completed).toEqual({ a: { stars: 2 } })
  })

  it('keeps the best score when retrying', () => {
    const best = recordResult(empty, 'a', 3, 3)
    expect(recordResult(best, 'a', 0, 3).completed.a.stars).toBe(3)
    const low = recordResult(empty, 'a', 0, 3)
    expect(recordResult(low, 'a', 3, 3).completed.a.stars).toBe(3)
  })

  it('does not change the original object', () => {
    const before = JSON.stringify(empty)
    recordResult(empty, 'a', 3, 3)
    expect(JSON.stringify(empty)).toBe(before)
  })
})

describe('stageStates', () => {
  const stages = [stage('a'), stage('b'), stage('c')]

  it('opens the first stage and locks the rest', () => {
    const states = stageStates(stages, empty)
    expect(states.map((s) => s.status)).toEqual(['open', 'locked', 'locked'])
  })

  it('names what to finish first', () => {
    expect(stageStates(stages, empty)[1].blockedBy).toBe('Title a')
  })

  it('marks the first unfinished open stage as next up', () => {
    const states = stageStates(stages, empty)
    expect(states.map((s) => s.next)).toEqual([true, false, false])
  })

  it('completes a stage with its stars and opens the following one', () => {
    const states = stageStates(stages, recordResult(empty, 'a', 3, 3))
    expect(states.map((s) => s.status)).toEqual(['completed', 'open', 'locked'])
    expect(states[0].stars).toBe(3)
    expect(states.map((s) => s.next)).toEqual([false, true, false])
  })

  it('opens every built stage with unlockAll', () => {
    const states = stageStates(stages, { ...empty, unlockAll: true })
    expect(states.map((s) => s.status)).toEqual(['open', 'open', 'open'])
    expect(states.map((s) => s.next)).toEqual([true, false, false])
  })

  it('never opens a stage that is not built, even with unlockAll', () => {
    const states = stageStates([stage('a'), stage('b', false)], { ...empty, unlockAll: true })
    expect(states.map((s) => s.status)).toEqual(['open', 'coming-soon'])
  })

  describe('stages that are not built yet do not block the ones after them', () => {
    const mixed = [stage('a'), stage('b', false), stage('c'), stage('d')]

    it('opens the next built stage once the nearest earlier built stage is completed', () => {
      const states = stageStates(mixed, recordResult(empty, 'a', 3, 3))
      expect(states.map((s) => s.status)).toEqual(['completed', 'coming-soon', 'open', 'locked'])
    })

    it('keeps it locked until then, naming that earlier built stage', () => {
      const states = stageStates(mixed, empty)
      expect(states.map((s) => s.status)).toEqual(['open', 'coming-soon', 'locked', 'locked'])
      expect(states[2].blockedBy).toBe('Title a')
      expect(states[3].blockedBy).toBe('Title c') // the nearest earlier built stage, not an unbuilt one
    })

    it('treats the first built stage as open even when planned stages come before it', () => {
      const states = stageStates([stage('x', false), stage('y'), stage('z')], empty)
      expect(states.map((s) => s.status)).toEqual(['coming-soon', 'open', 'locked'])
      expect(states[2].blockedBy).toBe('Title y')
    })

    it('marks the first open unfinished stage as next up across the gap', () => {
      const states = stageStates(mixed, recordResult(empty, 'a', 3, 3))
      expect(states.map((s) => s.next)).toEqual([false, false, true, false])
    })

    it('still opens everything built with unlock all', () => {
      const states = stageStates(mixed, { ...empty, unlockAll: true })
      expect(states.map((s) => s.status)).toEqual(['open', 'coming-soon', 'open', 'open'])
    })
  })

  it('shows later planned stages as coming soon, not locked', () => {
    const states = stageStates([stage('a'), stage('b', false), stage('c', false)], recordResult(empty, 'a', 3, 3))
    expect(states.map((s) => s.status)).toEqual(['completed', 'coming-soon', 'coming-soon'])
    expect(states.every((s) => !s.next || s.status === 'open')).toBe(true)
  })
})
