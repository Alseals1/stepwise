import type { Mark } from '../engine/types'

interface Props {
  array: number[]
  marks?: Record<number, Mark>
}

export function ArrayBoxes({ array, marks = {} }: Props) {
  if (array.length === 0) return <p className="array-empty">Empty array</p>
  return (
    <ol className="array-boxes" aria-label="Array">
      {array.map((value, i) => {
        const mark = marks[i]
        return (
          <li key={i} data-mark={mark} aria-current={mark === 'current' ? 'true' : undefined}>
            <span className="box-value">{value}</span>
            <span className="box-index">{i}</span>
            {mark === 'done' && <span className="sr-only">done</span>}
          </li>
        )
      })}
    </ol>
  )
}
