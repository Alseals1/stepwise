import { useMemo, useSyncExternalStore } from 'react'
import { parseRoute, type Route } from './parseRoute'

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const getHash = () => window.location.hash

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash, () => '')
  return useMemo(() => parseRoute(hash), [hash])
}
