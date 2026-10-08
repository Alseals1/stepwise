import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TOPIC_TOUR } from './steps'
import { Tour } from './Tour'

const RECTS: Record<string, { top: number; left: number; width: number; height: number }> = {
  picture: { top: 100, left: 20, width: 300, height: 120 },
  code: { top: 300, left: 340, width: 400, height: 220 },
  controls: { top: 600, left: 20, width: 720, height: 80 },
}

let scrolled: string[] = []

beforeEach(() => {
  scrolled = []
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const r = RECTS[this.getAttribute('data-tour') ?? ''] ?? { top: 0, left: 0, width: 0, height: 0 }
    return { ...r, right: r.left + r.width, bottom: r.top + r.height, x: r.left, y: r.top, toJSON: () => ({}) }
  })
  Element.prototype.scrollIntoView = vi.fn(function (this: Element) {
    scrolled.push(this.getAttribute('data-tour') ?? '')
  })
})
afterEach(() => vi.restoreAllMocks())

function Page({
  onFinish = () => {},
  targets = ['picture', 'code', 'controls'],
  finishNote,
}: {
  onFinish?: () => void
  targets?: string[]
  finishNote?: string
}) {
  return (
    <>
      <button>page button</button>
      {targets.map((t) => (
        <div key={t} data-tour={t}>
          {t} target
        </div>
      ))}
      <Tour steps={TOPIC_TOUR} onFinish={onFinish} finishNote={finishNote} />
    </>
  )
}
const bubble = () => screen.getByRole('dialog')
const spotlight = () => document.querySelector('.tour-spotlight') as HTMLElement

describe('Tour', () => {
  it('shows the first step in a labelled, non-modal dialog', () => {
    render(<Page />)
    const dialog = bubble()
    expect(dialog).toHaveAttribute('aria-modal', 'false')
    expect(screen.getByRole('heading', { name: 'The picture' })).toBeInTheDocument()
    expect(dialog).toHaveAccessibleName('The picture')
    expect(dialog).toHaveAccessibleDescription(/changes at every step/)
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
  })

  it('moves focus into the bubble, onto the heading', () => {
    render(<Page />)
    expect(screen.getByRole('heading', { name: 'The picture' })).toHaveFocus()
  })

  it('draws the spotlight around the target, with a little padding', () => {
    render(<Page />)
    const r = RECTS.picture
    expect(spotlight()).toHaveStyle({
      top: `${r.top - 6}px`,
      left: `${r.left - 6}px`,
      width: `${r.width + 12}px`,
      height: `${r.height + 12}px`,
    })
  })

  it('scrolls the target into view', () => {
    render(<Page />)
    expect(scrolled).toEqual(['picture'])
  })

  it('goes forward and back through the steps, moving the spotlight and the focus', async () => {
    const user = userEvent.setup()
    render(<Page />)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { name: 'The code' })).toHaveFocus()
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    expect(spotlight()).toHaveStyle({ top: `${RECTS.code.top - 6}px` })
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { name: 'The controls' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'The code' })).toBeInTheDocument()
  })

  it('cannot go back from the first step, and offers Done on the last', async () => {
    const user = userEvent.setup()
    render(<Page />)
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
  })

  it('tells the owner when it is finished, with Done, with Skip tour, or with Escape', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    const { unmount } = render(<Page onFinish={onFinish} />)
    await user.click(screen.getByRole('button', { name: 'Skip tour' }))
    expect(onFinish).toHaveBeenCalledTimes(1)
    unmount()

    const second = vi.fn()
    const again = render(<Page onFinish={second} />)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(second).toHaveBeenCalledTimes(1)
    again.unmount()

    const third = vi.fn()
    render(<Page onFinish={third} />)
    await user.keyboard('{Escape}')
    expect(third).toHaveBeenCalledTimes(1)
  })

  it('Escape works even when focus is elsewhere on the page', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    render(<Page onFinish={onFinish} />)
    screen.getByRole('button', { name: 'page button' }).focus()
    await user.keyboard('{Escape}')
    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  it('keeps the arrow keys and R for itself, so they do not also drive the player behind', () => {
    const behind = vi.fn()
    document.addEventListener('keydown', behind)
    render(<Page />)
    for (const key of ['ArrowRight', 'ArrowLeft', 'r', 'R']) {
      fireEvent.keyDown(screen.getByRole('button', { name: 'Next' }), { key })
    }
    expect(behind).not.toHaveBeenCalled()
    document.removeEventListener('keydown', behind)
  })

  it('does not block the page behind: the real controls stay clickable', async () => {
    const user = userEvent.setup()
    let clicked = false
    render(
      <>
        <button onClick={() => (clicked = true)}>page button</button>
        <div data-tour="picture" />
        <Tour steps={TOPIC_TOUR.slice(0, 1)} onFinish={() => {}} />
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'page button' }))
    expect(clicked).toBe(true)
  })

  it('moves the spotlight when the window is resized or scrolled', () => {
    render(<Page />)
    const original = RECTS.picture.top
    RECTS.picture = { ...RECTS.picture, top: original + 40 }
    act(() => void window.dispatchEvent(new Event('resize')))
    expect(spotlight()).toHaveStyle({ top: `${original + 40 - 6}px` })
    RECTS.picture = { ...RECTS.picture, top: original }
    act(() => void window.dispatchEvent(new Event('scroll')))
    expect(spotlight()).toHaveStyle({ top: `${original - 6}px` })
  })

  it('follows the target when the page layout shifts without any scrolling or resizing', () => {
    // e.g. a web font finishes loading and the text above the target re-wraps.
    let notify: () => void = () => {}
    const observed: Element[] = []
    class FakeResizeObserver {
      constructor(callback: () => void) {
        notify = callback
      }
      observe(element: Element) {
        observed.push(element)
      }
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    render(<Page />)
    expect(observed).toContain(document.body)

    const original = RECTS.picture.top
    RECTS.picture = { ...RECTS.picture, top: original + 25 }
    act(() => notify())
    expect(spotlight()).toHaveStyle({ top: `${original + 25 - 6}px` })
    RECTS.picture = { ...RECTS.picture, top: original }
    vi.unstubAllGlobals()
  })

  it('follows the target when web fonts finish loading', () => {
    const fonts = new EventTarget()
    Object.defineProperty(document, 'fonts', { value: fonts, configurable: true })
    render(<Page />)
    const original = RECTS.picture.top
    RECTS.picture = { ...RECTS.picture, top: original + 25 }
    act(() => void fonts.dispatchEvent(new Event('loadingdone')))
    expect(spotlight()).toHaveStyle({ top: `${original + 25 - 6}px` })
    RECTS.picture = { ...RECTS.picture, top: original }
    Reflect.deleteProperty(document, 'fonts')
  })

  it('stops listening for layout changes when the tour ends', () => {
    let disconnected = false
    class FakeResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {
        disconnected = true
      }
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    const { unmount } = render(<Page />)
    unmount()
    expect(disconnected).toBe(true)
    vi.unstubAllGlobals()
  })

  it('skips a step whose target is missing', async () => {
    const user = userEvent.setup()
    render(<Page targets={['picture', 'controls']} />)
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { name: 'The controls' })).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
  })

  it('finishes straight away when no target can be found at all', () => {
    const onFinish = vi.fn()
    render(<Page targets={[]} onFinish={onFinish} />)
    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('gives focus back to what had it before the tour started', async () => {
    const user = userEvent.setup()
    function Wrapper() {
      const [running, setRunning] = useState(true)
      return (
        <>
          <button autoFocus>opener</button>
          <div data-tour="picture" />
          {running && <Tour steps={TOPIC_TOUR.slice(0, 1)} onFinish={() => setRunning(false)} />}
        </>
      )
    }
    render(<Wrapper />)
    expect(screen.getByRole('heading', { name: 'The picture' })).toHaveFocus() // the tour took focus
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'opener' })).toHaveFocus()
  })
})

describe('TOPIC_TOUR predict step', () => {
  it('explains predict mode, that a wrong guess is fine, and the number keys', () => {
    const text = TOPIC_TOUR.find((s) => s.id === 'predict')!.text
    expect(text).toMatch(/guess|predict/i)
    expect(text).toMatch(/wrong/i)
    expect(text).toMatch(/1.*2.*3|number keys/i)
  })

  it('explains the your-own-numbers card', () => {
    const text = TOPIC_TOUR.find((s) => s.id === 'input')!.text
    expect(text).toMatch(/own numbers/i)
    expect(text).toMatch(/Apply/)
    expect(text).toMatch(/Random/)
  })

  it('leaves the replay hint to the tour itself, so it shows on whichever step is last', () => {
    for (const step of TOPIC_TOUR) expect(step.text).not.toMatch(/How to use/)
  })

  it('is skipped on a page that has no Predict mode switch', async () => {
    render(<Page targets={['picture', 'code', 'controls']} />)
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
  })
})

describe('Tour finish note', () => {
  it('shows the note on the last step only', async () => {
    const user = userEvent.setup()
    render(<Page finishNote="Replay this tour from How to use." />)
    expect(screen.queryByText('Replay this tour from How to use.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByText('Replay this tour from How to use.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { name: 'The controls' })).toBeInTheDocument()
    expect(screen.getByText('Replay this tour from How to use.')).toBeInTheDocument()
  })

  it('follows the last step that actually exists on the page', () => {
    render(<Page targets={['picture']} finishNote="Replay this tour from How to use." />)
    expect(screen.getByText('Replay this tour from How to use.')).toBeInTheDocument()
  })

  it('is part of the bubble\u2019s description, so a screen reader hears it', async () => {
    const user = userEvent.setup()
    render(<Page targets={['picture', 'code']} finishNote="Replay this tour from How to use." />)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(/Replay this tour/)
  })

  it('adds nothing when there is no note', async () => {
    render(<Page targets={['picture']} />)
    expect(document.querySelector('.tour-note')).not.toBeInTheDocument()
  })
})

describe('TOPIC_TOUR', () => {
  it('has five steps: the picture, the code, Predict mode, the controls and your own numbers', () => {
    expect(TOPIC_TOUR.map((s) => s.target)).toEqual(['picture', 'code', 'predict', 'controls', 'input'])
    for (const s of TOPIC_TOUR) {
      expect(s.title.length).toBeGreaterThan(0)
      expect(s.text.length).toBeGreaterThan(20)
    }
  })

  it('names the real keyboard shortcuts', () => {
    const controls = TOPIC_TOUR.find((s) => s.id === 'controls')!.text
    expect(controls).toMatch(/Space/)
    expect(controls).toMatch(/arrow keys/i)
    expect(controls).toMatch(/\bR\b/)
  })
})
