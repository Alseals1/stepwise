/** A rectangle in viewport coordinates, like getBoundingClientRect() gives. */
export interface Rect {
  top: number
  left: number
  width: number
  height: number
}

export interface Placement {
  top: number
  left: number
  /** Where the bubble sits: below the target, above it, or docked to the bottom of the screen. */
  side: 'below' | 'above' | 'docked'
  /** Distance from the bubble's left edge to its arrow, so the arrow points at the target. */
  arrowX: number
}

const GAP = 12
const MARGIN = 8
const ARROW_INSET = 16

/**
 * Chooses where a bubble goes next to a target: below if it fits, else above, else docked at the
 * bottom of the screen. It is always kept inside the screen sideways.
 */
export function placeTooltip(
  target: Rect,
  bubble: { width: number; height: number },
  viewport: { width: number; height: number },
): Placement {
  const targetBottom = target.top + target.height
  const roomBelow = viewport.height - targetBottom - GAP - MARGIN
  const roomAbove = target.top - GAP - MARGIN

  let top: number
  let side: Placement['side']
  if (bubble.height <= roomBelow) {
    top = targetBottom + GAP
    side = 'below'
  } else if (bubble.height <= roomAbove) {
    top = target.top - GAP - bubble.height
    side = 'above'
  } else {
    top = viewport.height - bubble.height - MARGIN
    side = 'docked'
  }

  const centered = target.left + target.width / 2 - bubble.width / 2
  const maxLeft = Math.max(viewport.width - bubble.width - MARGIN, MARGIN)
  const left = Math.min(Math.max(centered, MARGIN), maxLeft)

  const targetCenter = target.left + target.width / 2
  const arrowX = Math.min(Math.max(targetCenter - left, ARROW_INSET), bubble.width - ARROW_INSET)
  return { top, left, side, arrowX }
}
