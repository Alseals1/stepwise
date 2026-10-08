import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react'
import { placeTooltip, type Rect } from './placeTooltip'
import type { TourStep } from './steps'

interface Props {
  steps: TourStep[]
  /** Called when the tour ends, however it ends (Done, Skip tour, Escape, or nothing to point at). */
  onFinish: () => void
  /** Shown under the text of whichever step turns out to be the last one on this page. */
  finishNote?: string
}

const SPOTLIGHT_PADDING = 6

const findTarget = (step: TourStep) => document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)

// Which targets are on screen is a fact about the page (the DOM), so it is read like any outside
// store. It is empty on the first render and filled in right after the page has mounted.
const subscribeNever = () => () => {}

// Where a target is on screen changes with resizing and scrolling, and also when the page layout
// shifts by itself (a web font loads and the text above re-wraps, content appears), so all of
// these tell the tour to measure again.
function subscribeToLayout(onChange: () => void) {
  window.addEventListener('resize', onChange)
  window.addEventListener('scroll', onChange, true)
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onChange)
  observer?.observe(document.body)
  document.fonts?.addEventListener('loadingdone', onChange)
  return () => {
    window.removeEventListener('resize', onChange)
    window.removeEventListener('scroll', onChange, true)
    observer?.disconnect()
    document.fonts?.removeEventListener('loadingdone', onChange)
  }
}

/**
 * A short pointing tour: dims the page except one part of the screen and puts a bubble next to it.
 * It does not block the page, so the learner can try the real controls while it is open.
 */
export function Tour({ steps, onFinish, finishNote }: Props) {
  const titleId = useId()
  const textId = useId()
  const targetIds = useSyncExternalStore(
    subscribeNever,
    () => steps.filter((step) => findTarget(step)).map((step) => step.id).join(','),
    () => '',
  )
  const available = useMemo(() => {
    const ids = targetIds.split(',')
    return steps.filter((step) => ids.includes(step.id))
  }, [steps, targetIds])
  const [requestedIndex, setIndex] = useState(0)
  const [bubbleSize, setBubbleSize] = useState({ width: 0, height: 0 })
  const bubble = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const opener = useRef<Element | null>(null)

  const finish = useCallback(() => {
    if (opener.current instanceof HTMLElement && document.body.contains(opener.current)) opener.current.focus()
    onFinish()
  }, [onFinish])

  // Remember what had focus, and end at once if there is nothing on screen to point at.
  useEffect(() => {
    opener.current = document.activeElement
    if (steps.every((step) => !findTarget(step))) onFinish()
    // Only at the start: the steps and callback are fixed for the life of the tour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If a target disappears while the tour is open, stay on a step that still exists.
  const index = Math.min(requestedIndex, Math.max(available.length - 1, 0))
  const step = available[index]

  const rectKey = useSyncExternalStore(
    subscribeToLayout,
    () => {
      const target = step ? findTarget(step) : null
      if (!target) return ''
      const { top, left, width, height } = target.getBoundingClientRect()
      return `${top},${left},${width},${height}`
    },
    () => '',
  )
  const rect = useMemo<Rect | null>(() => {
    if (!rectKey) return null
    const [top, left, width, height] = rectKey.split(',').map(Number)
    return { top, left, width, height }
  }, [rectKey])

  // Bring the target into view and move focus to the bubble's heading.
  useEffect(() => {
    if (!step) return
    findTarget(step)?.scrollIntoView({ block: 'center' })
    heading.current?.focus()
  }, [step])

  const running = available.length > 0
  useEffect(() => {
    if (!running) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') finish()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [running, finish])

  useLayoutEffect(() => {
    const element = bubble.current
    if (!element) return
    const width = element.offsetWidth
    const height = element.offsetHeight
    setBubbleSize((current) => (current.width === width && current.height === height ? current : { width, height }))
  }, [rect, index, available])

  if (!step) return null

  const placement = rect
    ? placeTooltip(rect, bubbleSize, { width: window.innerWidth, height: window.innerHeight })
    : null
  const isLast = index === available.length - 1

  return (
    <>
      {rect && (
        <div
          className="tour-spotlight"
          aria-hidden="true"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
          }}
        />
      )}
      <div
        ref={bubble}
        className="tour-bubble"
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={textId}
        data-side={placement?.side}
        style={
          placement
            ? ({ top: placement.top, left: placement.left, '--arrow-x': `${placement.arrowX}px` } as CSSProperties)
            : { visibility: 'hidden' }
        }
        onKeyDown={(event) => {
          // The player behind listens for these keys; inside the bubble they belong to the tour.
          if (['ArrowLeft', 'ArrowRight', 'r', 'R'].includes(event.key)) event.stopPropagation()
        }}
      >
        <p className="tour-count">
          Step {index + 1} of {available.length}
        </p>
        <h2 id={titleId} ref={heading} tabIndex={-1}>
          {step.title}
        </h2>
        <p id={textId}>
          {step.text}
          {isLast && finishNote && <span className="tour-note"> {finishNote}</span>}
        </p>
        <div className="tour-actions">
          <button type="button" className="btn" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>
            Back
          </button>
          {isLast ? (
            <button type="button" className="btn primary" onClick={finish}>
              Done
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={() => setIndex((i) => i + 1)}>
              Next
            </button>
          )}
          <button type="button" className="tour-skip" onClick={finish}>
            Skip tour
          </button>
        </div>
      </div>
    </>
  )
}
