import { describe, expect, it } from 'vitest'
import { placeTooltip, type Rect } from './placeTooltip'

const viewport = { width: 1000, height: 700 }
const bubble = { width: 300, height: 140 }
const target = (overrides: Partial<Rect> = {}): Rect => ({ top: 100, left: 350, width: 300, height: 100, ...overrides })
const GAP = 12
const MARGIN = 8

describe('placeTooltip', () => {
  it('goes below the target when there is room, centered on it', () => {
    expect(placeTooltip(target(), bubble, viewport)).toMatchObject({
      side: 'below',
      top: 100 + 100 + GAP,
      left: 350, // 350 + 150 - 150
    })
  })

  it('flips above when there is not enough room below', () => {
    const t = target({ top: 500, height: 100 }) // bottom edge at 600, only 100px below
    expect(placeTooltip(t, bubble, viewport)).toMatchObject({ side: 'above', top: 500 - GAP - bubble.height })
  })

  it('docks at the bottom of the screen when it fits neither above nor below', () => {
    const tall = target({ top: 60, height: 620 }) // the target nearly fills the screen
    expect(placeTooltip(tall, bubble, viewport)).toMatchObject({
      side: 'docked',
      top: viewport.height - bubble.height - MARGIN,
    })
  })

  it('stays inside the screen at the left and right edges', () => {
    expect(placeTooltip(target({ left: 0, width: 80 }), bubble, viewport).left).toBe(MARGIN)
    expect(placeTooltip(target({ left: 920, width: 80 }), bubble, viewport).left).toBe(
      viewport.width - bubble.width - MARGIN,
    )
  })

  it('points the arrow at the middle of the target, kept inside the bubble', () => {
    expect(placeTooltip(target(), bubble, viewport).arrowX).toBe(150) // target center 500, bubble left 350
    const nearEdge = placeTooltip(target({ left: 0, width: 40 }), bubble, viewport)
    expect(nearEdge.arrowX).toBeGreaterThanOrEqual(16)
    const farEdge = placeTooltip(target({ left: 960, width: 40 }), bubble, viewport)
    expect(farEdge.arrowX).toBeLessThanOrEqual(bubble.width - 16)
  })

  it('keeps a bubble that is wider than the screen at the left margin', () => {
    expect(placeTooltip(target(), { width: 1200, height: 100 }, viewport).left).toBe(MARGIN)
  })

  it('works on a phone-sized screen', () => {
    const phone = { width: 390, height: 844 }
    const result = placeTooltip({ top: 150, left: 16, width: 358, height: 180 }, { width: 340, height: 170 }, phone)
    expect(result.side).toBe('below')
    expect(result.left).toBeGreaterThanOrEqual(MARGIN)
    expect(result.left + 340).toBeLessThanOrEqual(phone.width - MARGIN)
  })
})
