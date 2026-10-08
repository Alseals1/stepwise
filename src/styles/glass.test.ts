import { describe, expect, it } from 'vitest'
import css from '../index.css?raw'
import tokensCss from './tokens.css?raw'

const hex = (name: string) => new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(tokensCss)?.[1]
const percent = /--glass-percent:\s*(\d+(?:\.\d+)?)%/.exec(tokensCss)?.[1]

function channels(color: string) {
  return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16))
}
function luminance(rgb: number[]) {
  const [r, g, b] = rgb.map((c) => c / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** The text on the bubble must stay readable even if the page behind it is pure white. */
describe('glass bubble readability', () => {
  it('defines the glass amount as tokens', () => {
    expect(percent, '--glass-percent is missing').toBeDefined()
    expect(tokensCss).toMatch(/--glass-blur:\s*\d+px/)
  })

  it('keeps the main text above 4.5:1 over the worst case, a white page behind the glass', () => {
    const surface = channels(hex('surface-raised')!)
    const text = channels(hex('text')!)
    const alpha = Number(percent) / 100
    const worstBackdrop = [255, 255, 255]
    const effective = surface.map((c, i) => alpha * c + (1 - alpha) * worstBackdrop[i])
    expect(contrast(text, effective)).toBeGreaterThanOrEqual(4.5)
  })

  it('is genuinely translucent, but not so see-through that it stops working as a surface', () => {
    const value = Number(percent)
    expect(value).toBeLessThan(90)
    expect(value).toBeGreaterThanOrEqual(60)
  })
})

describe('glass bubble styles', () => {
  const rule = (selector: string) => {
    const start = css.indexOf(`${selector} {`)
    return start === -1 ? '' : css.slice(start, css.indexOf('}', start))
  }

  it('blurs what is behind the bubble and its arrow', () => {
    expect(rule('.tour-bubble')).toMatch(/backdrop-filter:\s*blur\(/)
    expect(rule('.tour-bubble::before')).toMatch(/backdrop-filter:\s*blur\(/)
  })

  it('uses a see-through background built from the token, not a solid color', () => {
    expect(rule('.tour-bubble')).toMatch(/background:\s*color-mix\([^;]*var\(--glass-percent\)[^;]*transparent\)/)
  })

  it('never uses the muted text color inside the bubble, where the backdrop varies', () => {
    const tourRules = css.match(/\.tour-[^{}]*\{[^}]*\}/g) ?? []
    expect(tourRules.length).toBeGreaterThan(5)
    for (const block of tourRules) expect(block).not.toContain('--text-muted')
  })

  it('falls back to a solid bubble when blur is unsupported', () => {
    expect(css).toMatch(/@supports not \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\)/)
  })

  it('falls back to a solid bubble when the system asks for reduced transparency', () => {
    expect(css).toMatch(/@media \(prefers-reduced-transparency: reduce\)/)
  })
})
