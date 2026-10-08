import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { Link } from './Link'
import { useRoute } from './useRoute'

beforeEach(() => {
  window.location.hash = ''
})

describe('useRoute', () => {
  it('starts from the current hash', () => {
    window.location.hash = '#/topic/sum-demo'
    const { result } = renderHook(() => useRoute())
    expect(result.current).toEqual({ name: 'topic', id: 'sum-demo' })
  })

  it('follows hash changes (links and the Back button)', async () => {
    const { result } = renderHook(() => useRoute())
    expect(result.current).toEqual({ name: 'home' })
    await act(async () => {
      window.location.hash = '#/topic/two-pointers'
    })
    await waitFor(() => expect(result.current).toEqual({ name: 'topic', id: 'two-pointers' }))
    await act(async () => {
      window.location.hash = '#/nope'
    })
    await waitFor(() => expect(result.current).toEqual({ name: 'not-found' }))
  })
})

describe('Link', () => {
  it('is a normal anchor to the hash URL, so it works with middle-click and Back', () => {
    render(<Link to="/topic/sum-demo">Warm-up</Link>)
    expect(screen.getByRole('link', { name: 'Warm-up' })).toHaveAttribute('href', '#/topic/sum-demo')
  })

  it('navigates when clicked and passes extra props through', async () => {
    const user = userEvent.setup()
    render(
      <Link to="/topic/x" className="stage-card" aria-label="Go to x">
        X
      </Link>,
    )
    const link = screen.getByRole('link', { name: 'Go to x' })
    expect(link).toHaveClass('stage-card')
    await user.click(link)
    expect(window.location.hash).toBe('#/topic/x')
  })
})
