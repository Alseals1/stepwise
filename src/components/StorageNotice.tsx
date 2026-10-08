import { useProgress } from '../progress/ProgressContext'

export function StorageNotice() {
  const { canSave } = useProgress()
  if (canSave) return null
  return (
    <p className="notice">
      Progress can&apos;t be saved in this browser, so it will only last until you close this tab.
    </p>
  )
}
