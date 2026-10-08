import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('shows the app name and tagline', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Stepwise' })).toBeInTheDocument()
    expect(screen.getByText(/see every step of an algorithm/i)).toBeInTheDocument()
  })
})
