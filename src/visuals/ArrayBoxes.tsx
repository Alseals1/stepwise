import type { Mark, Pointer } from '../engine/types'

interface Props {
  array: number[]
  marks?: Record<number, Mark>
  /** Named positions shown under their boxes. When given (even empty), every box keeps room for them. */
  pointers?: Pointer[]
  /** The list's accessible name. */
  label?: string
}

export function ArrayBoxes({ array, marks = {}, pointers, label = 'Array' }: Props) {
  if (array.length === 0) return <p className="array-empty">Empty array</p>
  return (
    <ol className="array-boxes" aria-label={label}>
      {array.map((value, i) => {
        const mark = marks[i]
        return (
          <li key={i} data-mark={mark} aria-current={mark === 'current' ? 'true' : undefined}>
            <span className="box-value">{value}</span>
            <span className="box-index">{i}</span>
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
          </li>
        )
      })}
    </ol>
  )
}
