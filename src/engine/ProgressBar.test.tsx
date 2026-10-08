import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('is an accessible progress bar with its value and range', () => {
    render(<ProgressBar value={3} max={7} label="Step progress" valueText="Step 3 of 7" />)
    const bar = screen.getByRole('progressbar', { name: 'Step progress' })
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '7')
    expect(bar).toHaveAttribute('aria-valuetext', 'Step 3 of 7')
  })

  it('fills in proportion to the value', () => {
    render(<ProgressBar value={1} max={4} label="p" />)
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '25%' })
  })

  it('clamps values outside the range', () => {
    const { rerender } = render(<ProgressBar value={12} max={9} label="p" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '9')
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '100%' })
    rerender(<ProgressBar value={-2} max={9} label="p" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '0%' })
  })

  it('shows an empty bar when max is 0', () => {
    render(<ProgressBar value={0} max={0} label="p" />)
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '0%' })
  })
})
