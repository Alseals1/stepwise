import type { StageInfo } from '../topics/types'

export type StarCount = 1 | 2 | 3

export interface Progress {
  completed: Record<string, { stars: StarCount }>
  /** Opens every built stage, so the learner can skip ahead. */
  unlockAll: boolean
}

export type StageStatus = 'open' | 'completed' | 'locked' | 'coming-soon'

export interface StageState {
  stage: StageInfo
  status: StageStatus
  stars?: StarCount
  /** The first open stage that is not completed yet. */
  next: boolean
  /** For a locked stage: the title of the stage to finish first. */
  blockedBy?: string
}

/** 3 stars for all correct, 2 for at least half, otherwise 1. Finishing always earns one. */
export function starsFor(correct: number, total: number): StarCount {
  if (total <= 0) return 1
  const ratio = correct / total
  if (ratio >= 1) return 3
  if (ratio >= 0.5) return 2
  return 1
}

/** Completes the topic and keeps the best stars across retries. */
export function recordResult(progress: Progress, id: string, correct: number, total: number): Progress {
  const stars = starsFor(correct, total)
  const best = Math.max(stars, progress.completed[id]?.stars ?? 0) as StarCount
  return { ...progress, completed: { ...progress.completed, [id]: { stars: best } } }
}

export function stageStates(stages: StageInfo[], progress: Progress): StageState[] {
  let nextTaken = false
  return stages.map((stage, i) => {
    const done = progress.completed[stage.id]
    const previous = stages[i - 1]
    let status: StageStatus
    if (!stage.available) status = 'coming-soon'
    else if (done) status = 'completed'
    else if (progress.unlockAll || i === 0 || progress.completed[previous.id]) status = 'open'
    else status = 'locked'

    const next = status === 'open' && !nextTaken
    if (next) nextTaken = true
    return {
      stage,
      status,
      stars: done?.stars,
      next,
      blockedBy: status === 'locked' ? previous.title : undefined,
    }
  })
}
