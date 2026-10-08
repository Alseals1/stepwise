import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnalogyCard } from './AnalogyCard'
import { BigOCard } from './BigOCard'
import { WatchFirst } from './WatchFirst'

describe('AnalogyCard', () => {
  it('tells the analogy and where it breaks', () => {
    render(<AnalogyCard analogy={{ text: 'A grocery receipt.', breaks: 'Computers cannot eyeball it.' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Analogy' })).toBeInTheDocument()
    expect(screen.getByText('A grocery receipt.')).toBeInTheDocument()
    expect(screen.getByText('Where the analogy breaks:')).toBeInTheDocument()
    expect(screen.getByText('Computers cannot eyeball it.')).toBeInTheDocument()
  })
})

describe('BigOCard', () => {
  const bigO = { time: 'O(n)', timeBecause: 'one pass.', space: 'O(1)', spaceBecause: 'one total.' }

  it('states time and space with their reasons', () => {
    render(<BigOCard bigO={bigO} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Big O' })).toBeInTheDocument()
    const time = screen.getByText('Time').closest('p')!
    expect(time).toHaveTextContent('Time O(n) because one pass.')
    const space = screen.getByText('Space').closest('p')!
    expect(space).toHaveTextContent('Space O(1) because one total.')
  })
})

describe('WatchFirst', () => {
  it('links the video in a new tab and says so', () => {
    render(<WatchFirst video={{ label: 'Two pointers in 10 minutes', url: 'https://example.com/v' }} />)
    const link = screen.getByRole('link', { name: /Two pointers in 10 minutes/ })
    expect(link).toHaveAttribute('href', 'https://example.com/v')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link).toHaveAccessibleName(/opens in a new tab/i)
  })

  it('renders nothing when the topic has no video', () => {
    const { container } = render(<WatchFirst video={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })
})
