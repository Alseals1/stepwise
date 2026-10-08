import { describe, expect, it } from 'vitest'
import { highlight } from './highlighter'

describe('highlight', () => {
  const js = 'function sum(numbers) {\n  let total = 0\n  return total\n}'

  it('returns one token list per line of code', async () => {
    const lines = await highlight(js, 'js')
    expect(lines).toHaveLength(4)
    expect(lines[1].map((t) => t.content).join('')).toBe('  let total = 0')
  })

  it('colors keywords and leaves nothing out', async () => {
    const lines = await highlight(js, 'js')
    const keyword = lines[0].find((t) => t.content === 'function')
    expect(keyword?.color).toMatch(/^#[0-9a-f]{6}/i)
    expect(lines.map((l) => l.map((t) => t.content).join('')).join('\n')).toBe(js)
  })

  it('understands TypeScript annotations', async () => {
    const ts = 'function sum(numbers: number[]): number {\n  return 1\n}'
    const lines = await highlight(ts, 'ts')
    expect(lines).toHaveLength(3)
    expect(lines[0].map((t) => t.content).join('')).toBe('function sum(numbers: number[]): number {')
  })
})
