import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VariablesPanel } from './VariablesPanel'

describe('VariablesPanel', () => {
  it('lists each variable with its value', () => {
    render(<VariablesPanel vars={{ total: 6, n: 4 }} />)
    const panel = screen.getByRole('region', { name: 'Variables' })
    expect(within(panel).getByText('total')).toBeInTheDocument()
    expect(within(panel).getByText('6')).toBeInTheDocument()
    expect(within(panel).getByText('n')).toBeInTheDocument()
    expect(within(panel).getByText('4')).toBeInTheDocument()
  })

  it('formats arrays, strings, booleans, null and undefined like code', () => {
    render(
      <VariablesPanel
        vars={{ list: [2, 4, 6], word: 'hi', done: false, none: null, missing: undefined, nested: [[1], ['a']] }}
      />,
    )
    expect(screen.getByText('[2, 4, 6]')).toBeInTheDocument()
    expect(screen.getByText('"hi"')).toBeInTheDocument()
    expect(screen.getByText('false')).toBeInTheDocument()
    expect(screen.getByText('null')).toBeInTheDocument()
    expect(screen.getByText('undefined')).toBeInTheDocument()
    expect(screen.getByText('[[1], ["a"]]')).toBeInTheDocument()
  })

  it('says so when there are no variables yet', () => {
    render(<VariablesPanel vars={{}} />)
    expect(screen.getByText('No variables yet')).toBeInTheDocument()
  })
})
