import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Narration } from './Narration'

describe('Narration', () => {
  it('shows the sentence in a polite live region so screen readers announce each step', () => {
    render(<Narration say="Add 4 to the total, which is now 6." />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Add 4 to the total, which is now 6.')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })
})
