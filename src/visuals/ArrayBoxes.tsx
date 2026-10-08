import type { CSSProperties } from 'react'
import type { Mark, Pointer } from '../engine/types'

interface Props {
  /** Numbers, or single characters for a word. */
  array: (string | number)[]
  marks?: Record<number, Mark>
  /** Named positions shown under their boxes. When given (even empty), every box keeps room for them. */
  pointers?: Pointer[]
  /** How many tag lines each box reserves under it (default 1). Set it to the most tags that can share a box. */
  pointerSlots?: number
  /** The list's accessible name. */
  label?: string
  /** Shown under each box instead of its position (for example the index a Map maps its value to). */
  indexes?: number[]
}

export function ArrayBoxes({ array, marks = {}, pointers, pointerSlots, label = 'Array', indexes }: Props) {
  if (array.length === 0) return <p className="array-empty">Empty array</p>
  return (
    <ol
      className="array-boxes"
      aria-label={label}
      style={pointerSlots ? ({ '--pointer-slots': pointerSlots } as CSSProperties) : undefined}
    >
      {array.map((value, i) => {
        const mark = marks[i]
        return (
          <li key={i} data-mark={mark} aria-current={mark === 'current' ? 'true' : undefined}>
            <span className="box-value">{value}</span>
            <span className="box-index">{indexes?.[i] ?? i}</span>
            {pointers && (
              <span className="box-pointers">
                {pointers
                  .filter((pointer) => pointer.index === i)
                  .map((pointer) => (
                    <span key={pointer.label} className="box-pointer" data-pointer={pointer.label}>
                      {pointer.label}
                    </span>
                  ))}
              </span>
            )}
            {mark === 'done' && <span className="sr-only">done</span>}
            {mark === 'mismatch' && <span className="sr-only">does not match</span>}
          </li>
        )
      })}
    </ol>
  )
}
