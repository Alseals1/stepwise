import { describe, expect, it } from 'vitest'

const cssFiles = import.meta.glob('../**/*.css', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

describe('no hardcoded colors', () => {
  const others = Object.entries(cssFiles).filter(([path]) => !path.endsWith('tokens.css'))

  it('finds the stylesheets to check', () => {
    expect(others.length).toBeGreaterThan(0)
  })

  it.each(others)('%s uses only color tokens', (_path, css) => {
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(withoutComments.match(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/gi) ?? []).toEqual([])
  })
})
