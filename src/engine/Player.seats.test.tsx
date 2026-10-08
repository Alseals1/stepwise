import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getEntry } from '../topics/registry'
import { highlight } from './highlighter'
import { Player } from './Player'

vi.mock('./highlighter', () => ({ highlight: vi.fn() }))

const entry = getEntry('array-basics')!
const seatLabels = () =>
  within(screen.getByRole('list', { name: 'Seats' }))
    .getAllByRole('listitem')
    .map((li) => li.getAttribute('aria-label'))

beforeEach(() => {
  vi.mocked(highlight).mockReturnValue(new Promise(() => {}))
})

describe('Player with a seat-row topic', () => {
  it('shows the seats instead of the plain array boxes', () => {
    render(<Player frames={entry.frames} code={entry.code} />)
    expect(screen.getByRole('list', { name: 'Seats' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Array' })).not.toBeInTheDocument()
    expect(seatLabels()).toEqual(['Seat 0: 3', 'Seat 1: 5', 'Seat 2: 8'])
  })

  it('moves the boxes as the steps advance, and shows what was said', async () => {
    const user = userEvent.setup()
    render(<Player frames={entry.frames} code={entry.code} />)
    await user.click(screen.getByRole('button', { name: 'Next' })) // push
    expect(seatLabels()).toEqual(['Seat 0: 3', 'Seat 1: 5', 'Seat 2: 8', 'Seat 3: 9'])
    await user.click(screen.getByRole('button', { name: 'Next' })) // the first element slides
    expect(seatLabels()).toEqual(['Seat 0: 3', 'Seat 1: 5', 'Seat 2: 8', 'Seat 4: 9'])
    expect(screen.getByRole('status')).toHaveTextContent('the element in seat 3 slides to seat 4')
  })

  it('shows the moves counter in the variables, ending at 7 for three elements', async () => {
    const user = userEvent.setup()
    render(<Player frames={entry.frames} code={entry.code} />)
    for (let i = 0; i < entry.frames.length - 1; i++) await user.click(screen.getByRole('button', { name: 'Next' }))
    const variables = screen.getByRole('region', { name: 'Variables' })
    expect(within(variables).getByText('moves').nextElementSibling).toHaveTextContent('7')
    expect(seatLabels()).toEqual(['Seat 0: 3', 'Seat 1: 5', 'Seat 2: 8'])
  })

  it('highlights the line of the running operation', async () => {
    const user = userEvent.setup()
    render(<Player frames={entry.frames} code={entry.code} />)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(document.querySelector('[aria-current="step"]')).toHaveTextContent('seats.push(9)')
  })

  it('still shows the plain boxes for a topic without seats', () => {
    render(<Player frames={getEntry('sum-demo')!.frames} code={getEntry('sum-demo')!.code} />)
    expect(screen.getByRole('list', { name: 'Array' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Seats' })).not.toBeInTheDocument()
  })

  it('asks "how many will move?" in predict mode, before the seats change', async () => {
    const user = userEvent.setup()
    render(<Player frames={entry.frames} code={entry.code} initialPredict />)
    await user.click(screen.getByRole('button', { name: 'Next' })) // push is asked about
    expect(screen.getByRole('heading', { name: 'How many elements will move when we push?' })).toBeInTheDocument()
    expect(seatLabels()).toEqual(['Seat 0: 3', 'Seat 1: 5', 'Seat 2: 8']) // not pushed yet
    await user.click(screen.getByRole('button', { name: '0' }))
    expect(seatLabels()).toEqual(['Seat 0: 3', 'Seat 1: 5', 'Seat 2: 8', 'Seat 3: 9'])
    expect(screen.getByText('Right!')).toBeInTheDocument()
  })
})
