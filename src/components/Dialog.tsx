import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  /** Called when the learner closes it (Close button, Escape, or a click on the dimmed area). */
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * A modal built on the native <dialog>: the browser traps focus, makes the page behind inert and
 * closes it on Escape. The content is only mounted while open, so each opening starts clean.
 */
export function Dialog({ open, onClose, title, children }: Props) {
  const titleId = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const openRef = useRef(open)

  useEffect(() => {
    openRef.current = open
    const element = dialog.current
    if (!element) return
    if (open && !element.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      element.showModal()
      heading.current?.focus()
    } else if (!open && element.open) {
      element.close()
    }
  }, [open])

  // Fires however it was closed. Only tell the parent if the parent did not do it.
  function handleClose() {
    opener.current?.focus()
    if (openRef.current) onClose()
  }

  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby={titleId}
      onClose={handleClose}
      onClick={(event) => {
        // A click on the dimmed area is reported with the dialog element itself as the target.
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {open && (
        <div className="modal-panel">
          <div className="modal-header">
            <h2 id={titleId} ref={heading} tabIndex={-1}>
              {title}
            </h2>
            <button type="button" className="modal-close" onClick={onClose}>
              <span aria-hidden="true">×</span>
              <span className="sr-only">Close</span>
            </button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      )}
    </dialog>
  )
}
