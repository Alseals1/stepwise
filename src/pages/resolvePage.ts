import type { StageState } from '../progress/progress'
import type { Route } from '../router/parseRoute'
import type { TopicEntry } from '../topics/registry'

export type Page =
  | { page: 'home' }
  | { page: 'badges' }
  | { page: 'how-to' }
  | { page: 'not-found'; reason: 'unknown' | 'not-built' }
  | { page: 'locked'; state: StageState }
  | { page: 'topic'; state: StageState; entry: TopicEntry }

/** Decides which page a URL shows, from the route, the stage states and the built topics. */
export function resolvePage(
  route: Route,
  states: StageState[],
  getEntry: (id: string) => TopicEntry | undefined,
): Page {
  if (route.name === 'home') return { page: 'home' }
  if (route.name === 'badges') return { page: 'badges' }
  if (route.name === 'how-to') return { page: 'how-to' }
  if (route.name === 'not-found') return { page: 'not-found', reason: 'unknown' }

  const state = states.find((s) => s.stage.id === route.id)
  if (!state) return { page: 'not-found', reason: 'unknown' }
  const entry = getEntry(route.id)
  if (state.status === 'coming-soon' || !entry) return { page: 'not-found', reason: 'not-built' }
  if (state.status === 'locked') return { page: 'locked', state }
  return { page: 'topic', state, entry }
}
