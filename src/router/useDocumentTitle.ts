import { useEffect } from 'react'

/** Sets the browser tab title, so screen readers and the history list say where you are. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Stepwise`
  }, [title])
}
