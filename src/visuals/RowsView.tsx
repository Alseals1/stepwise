import type { Row } from '../engine/types'
import { ArrayBoxes } from './ArrayBoxes'

/** Several arrays at once, each with a name, for example the input and the array being built. */
export function RowsView({ rows }: { rows: Row[] }) {
  return (
    <div className="rows-view">
      {rows.map((row) => (
        <div key={row.label} className="row">
          <p className="row-label">{row.label}</p>
          <ArrayBoxes array={row.values} marks={row.marks} label={row.label} />
        </div>
      ))}
    </div>
  )
}
