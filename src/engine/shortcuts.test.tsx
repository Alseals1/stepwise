import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SHORTCUTS } from './shortcuts'
import { useStepperKeys } from './useStepperKeys'

const handlers = { next: vi.fn(), back: vi.fn(), restart: vi.fn(), togglePlay: vi.fn(), choose: vi.fn() }

function Harness() {
  useStepperKeys(handlers)
  return null
}

describe('SHORTCUTS (what the How-to page documents)', () => {
  it('lists the five keyboard shortcuts', () => {
    expect(SHORTCUTS.map((s) => s.action)).toEqual([
      'Play or pause',
      'Next step',
      'Previous step',
      'Restart',
      'Answer a prediction',
    ])
  })

  it.each(SHORTCUTS)('$action: pressing $label really does it', ({ key, handler }) => {
    Object.values(handlers).forEach((fn) => fn.mockClear())
    render(<Harness />)
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    expect(handlers[handler]).toHaveBeenCalledTimes(1)
    for (const [name, fn] of Object.entries(handlers)) if (name !== handler) expect(fn).not.toHaveBeenCalled()
  })

  it('names each button as it appears on screen', () => {
    expect(SHORTCUTS.map((s) => s.button)).toEqual([
      'Play / Pause',
      'Next',
      'Back',
      'Restart',
      'The answer buttons',
    ])
  })
})
