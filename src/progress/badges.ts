import { stages } from '../topics/stages'
import type { SavedState } from './state'

export interface BadgeDef {
  id: string
  title: string
  /** What it celebrates. */
  description: string
  /** How to earn it, shown while locked. */
  hint: string
  /** For badges earned by completing one topic. */
  topicId?: string
  earned: (state: SavedState) => boolean
}

const completes = (topicId: string) => (s: SavedState) => topicId in s.completed

/** To add a badge, add an entry. Order here is the order on the badges page. */
export const BADGES: BadgeDef[] = [
  {
    id: 'first-run',
    title: 'First Run',
    description: 'You watched an algorithm run all the way through.',
    hint: 'Play any animation to its last step.',
    earned: (s) => Object.keys(s.runs).length > 0,
  },
  {
    id: 'first-quiz',
    title: 'First Quiz',
    description: 'You checked your answers on a quiz.',
    hint: 'Check your answers on any quiz.',
    earned: (s) => Object.keys(s.completed).length > 0,
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Every answer right, three stars.',
    hint: 'Get 3 stars on any topic.',
    earned: (s) => Object.values(s.completed).some((c) => c.stars === 3),
  },
  {
    id: 'streak-3',
    title: '3-Day Streak',
    description: 'You studied three days in a row.',
    hint: 'Study three days in a row.',
    earned: (s) => s.streak.longest >= 3,
  },
  {
    id: 'streak-7',
    title: '7-Day Streak',
    description: 'A whole week of studying.',
    hint: 'Study seven days in a row.',
    earned: (s) => s.streak.longest >= 7,
  },
  {
    id: 'path-complete',
    title: 'Path Complete',
    description: 'You finished every stage on the map.',
    hint: `Complete all ${stages.length} stages.`,
    earned: (s) => stages.every((stage) => stage.id in s.completed),
  },
  {
    id: 'hidden-loop-spotter',
    title: 'Hidden Loop Spotter',
    description: 'You can see the loop hiding inside includes().',
    hint: 'Complete "The hidden loop".',
    topicId: 'hidden-loops',
    earned: completes('hidden-loops'),
  },
  {
    id: 'set-master',
    title: 'Set Master',
    description: 'You traded memory for speed with a Set.',
    hint: 'Complete "Duplicate check: loops vs a Set".',
    topicId: 'has-duplicate',
    earned: completes('has-duplicate'),
  },
  {
    id: 'pointer-pro',
    title: 'Pointer Pro',
    description: 'You can walk in from both ends.',
    hint: 'Complete "Two pointers".',
    topicId: 'two-pointers',
    earned: completes('two-pointers'),
  },
]

/** Badges earned right now that have not been recorded yet. Never removes one. */
export function evaluateBadges(state: SavedState): string[] {
  return BADGES.filter((b) => !(b.id in state.badges) && b.earned(state)).map((b) => b.id)
}
