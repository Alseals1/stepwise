import type { StageInfo } from './types'

/** The level map, in order. Mark a stage `available` once its topic is built and registered. */
export const stages: StageInfo[] = [
  {
    id: 'sum-demo',
    title: 'Warm-up: Add up the numbers',
    blurb: 'Watch a loop add numbers one at a time.',
    difficulty: 1,
    available: true,
  },
  {
    id: 'array-basics',
    title: 'Array basics',
    blurb: 'push, pop, shift and unshift, and what each one costs.',
    difficulty: 1,
    available: true,
  },
  {
    id: 'map-filter-reduce',
    title: 'map, filter and reduce',
    blurb: 'Transform a list one item at a time.',
    difficulty: 1,
    available: true,
  },
  {
    id: 'hidden-loops',
    title: 'The hidden loop',
    blurb: 'Why includes() inside a loop gets slow.',
    difficulty: 2,
    available: true,
  },
  {
    id: 'has-duplicate',
    title: 'Duplicate check: loops vs a Set',
    blurb: 'Trade a little memory for a lot of speed.',
    difficulty: 2,
    available: true,
  },
  {
    id: 'two-pointers',
    title: 'Two pointers',
    blurb: 'Walk in from both ends of a sorted list.',
    difficulty: 2,
    available: false,
  },
  {
    id: 'binary-search',
    title: 'Binary search',
    blurb: 'Halve the search space with every step.',
    difficulty: 2,
    available: false,
  },
  {
    id: 'hash-map-two-sum',
    title: 'Hash map: Two Sum',
    blurb: 'Find a pair using a lookup table.',
    difficulty: 2,
    available: false,
  },
]
