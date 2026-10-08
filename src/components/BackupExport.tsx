import { useEffect, useRef, useState } from 'react'
import { useProgress } from '../progress/ProgressContext'
import { dayKey } from '../progress/streak'
import { backupFileName, buildBackup, serializeBackup } from '../storage/backup'
import { copyText, downloadText } from '../storage/browser'

interface Props {
  /** Replaceable in tests. */
  download?: (filename: string, text: string) => void
  copy?: (text: string) => Promise<boolean>
  now?: () => Date
}

const systemClock = () => new Date()

export function BackupExport({ download = downloadText, copy = copyText, now = systemClock }: Props) {
  const { progress } = useProgress()
  const [message, setMessage] = useState('')
  const [fallbackText, setFallbackText] = useState<string | null>(null)
  const box = useRef<HTMLTextAreaElement>(null)

  // When copying is blocked, put the text in front of the learner, already selected.
  useEffect(() => {
    if (fallbackText !== null) {
      box.current?.focus()
      box.current?.select()
    }
  }, [fallbackText])

  function downloadFile() {
    const date = now()
    download(backupFileName(dayKey(date)), serializeBackup(buildBackup(progress, date), 'file'))
    setFallbackText(null)
    setMessage('Backup downloaded.')
  }

  async function copyBackup() {
    const text = serializeBackup(buildBackup(progress, now()), 'text')
    if (await copy(text)) {
      setFallbackText(null)
      setMessage('Backup copied.')
    } else {
      setFallbackText(text)
      setMessage("Couldn't copy automatically. Select and copy the text below.")
    }
  }

  return (
    <div className="backup-export">
      <div className="backup-actions">
        <button type="button" className="btn" onClick={downloadFile}>
          Download backup
        </button>
        <button type="button" className="btn" onClick={copyBackup}>
          Copy backup
        </button>
      </div>
      <p className="backup-message" aria-live="polite">
        {message}
      </p>
      {fallbackText !== null && (
        <label className="backup-fallback">
          <span className="sr-only">Backup text to copy by hand</span>
          <textarea ref={box} readOnly rows={4} value={fallbackText} />
        </label>
      )}
    </div>
  )
}
