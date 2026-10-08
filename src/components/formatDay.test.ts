import { describe, expect, it } from 'vitest'
import { formatDay } from './formatDay'

describe('formatDay', () => {
  it.each([
    ['2026-10-06', 'Oct 6, 2026'],
    ['2026-01-01', 'Jan 1, 2026'],
    ['2027-12-31', 'Dec 31, 2027'],
  ])('formats %s as %s', (key, text) => {
    expect(formatDay(key)).toBe(text)
  })

  it('returns the original text if it is not a day key', () => {
    expect(formatDay('whenever')).toBe('whenever')
  })
})
