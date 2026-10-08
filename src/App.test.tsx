import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { highlight } from './engine/highlighter'

vi.mock('./engine/highlighter', () => ({ highlight: vi.fn() }))

beforeEach(() => {
  vi.mocked(highlight).mockReturnValue(new Promise(() => {}))
})

describe('App', () => {
  it('shows the app name and tagline', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Stepwise' })).toBeInTheDocument()
    expect(screen.getByText(/see every step of an algorithm/i)).toBeInTheDocument()
  })

  it('has a banner with the wordmark and tagline', () => {
    render(<App />)
    const banner = screen.getByRole('banner')
    expect(within(banner).getByRole('heading', { level: 1, name: 'Stepwise' })).toBeInTheDocument()
    expect(within(banner).getByText(/see every step of an algorithm/i)).toBeInTheDocument()
  })

  it('shows the demo topic on the step player', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 2, name: 'Add up the numbers' })).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 9')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Call sum with [2, 4, 6].')
  })
})
