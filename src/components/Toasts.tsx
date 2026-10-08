import { useEffect } from 'react'
import { BADGES } from '../progress/badges'
import { useProgress, type Toast } from '../progress/ProgressContext'
import { MedalIcon } from './Icons'

export const TOAST_MS = 6000

function ToastItem({ toast }: { toast: Toast }) {
  const { dismissToast } = useProgress()
  const badge = BADGES.find((b) => b.id === toast.badgeId)

  useEffect(() => {
    const id = setTimeout(() => dismissToast(toast.key), TOAST_MS)
    return () => clearTimeout(id)
  }, [toast.key, dismissToast])

  if (!badge) return null
  return (
    <div className="toast">
      <MedalIcon className="toast-icon" />
      <div>
        <p className="toast-title">Badge unlocked: {badge.title}</p>
        <p className="toast-text">{badge.description}</p>
      </div>
      <button type="button" className="toast-dismiss" onClick={() => dismissToast(toast.key)}>
        <span aria-hidden="true">×</span>
        <span className="sr-only">Dismiss {badge.title} toast</span>
      </button>
    </div>
  )
}

/** Not role="status": the step narration is the page's one status region. */
export function Toasts() {
  const { toasts } = useProgress()
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.key} toast={toast} />
      ))}
    </div>
  )
}
