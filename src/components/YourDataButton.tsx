import { useState } from 'react'
import { Dialog } from './Dialog'
import { DataIcon } from './Icons'
import { YourData } from './YourData'

/** The header chip that opens the backup, restore and reset tools in a modal. */
export function YourDataButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="chip chip-data" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <DataIcon />
        Your data
      </button>
      <Dialog open={open} title="Your data" onClose={() => setOpen(false)}>
        <YourData />
      </Dialog>
    </>
  )
}
