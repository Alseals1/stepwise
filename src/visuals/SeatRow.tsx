import type { CSSProperties } from 'react'
import type { Seat } from '../engine/types'

interface Props {
  seats: Seat[]
  seatCount: number
}

/**
 * A row of numbered cinema seats with a box in each occupied one. A box is placed by its `--seat`
 * number, so when a frame changes a box's seat, CSS makes it glide there. The boxes are rendered in
 * a fixed order (not seat order) so that the same element is kept, which lets the move animate.
 */
export function SeatRow({ seats, seatCount }: Props) {
  return (
    <div className="seat-row" style={{ '--seat-count': seatCount } as CSSProperties}>
      {Array.from({ length: seatCount }, (_, i) => (
        <span key={i} className="seat-slot" data-index={i} aria-hidden="true" style={{ '--seat': i } as CSSProperties} />
      ))}
      <ol className="seat-boxes" aria-label="Seats">
        {seats.map((seat) => (
          <li
            key={seat.id}
            className="seat"
            data-mark={seat.mark}
            aria-label={`Seat ${seat.seat}: ${seat.value}${seat.mark === 'removed' ? ' (removed)' : ''}`}
            style={{ '--seat': seat.seat } as CSSProperties}
          >
            <span className="box-value" aria-hidden="true">
              {seat.value}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
