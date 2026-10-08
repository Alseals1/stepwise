export type Route = { name: 'home' } | { name: 'topic'; id: string } | { name: 'not-found' }

export const HOME_PATH = '/'
export const topicPath = (id: string) => `/topic/${id}`

/** Reads a `location.hash` such as "#/topic/sum-demo". */
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '')
  if (path === '') return { name: 'home' }
  const topic = /^\/topic\/([a-z0-9-]+)$/.exec(path)
  if (topic) return { name: 'topic', id: topic[1] }
  return { name: 'not-found' }
}
