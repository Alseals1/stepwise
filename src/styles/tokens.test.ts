import { describe, expect, it } from 'vitest'
import tokensCss from './tokens.css?raw'

function readTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {}
  for (const [, name, value] of css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) tokens[name] = value
  return tokens
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const tokens = readTokens(tokensCss)

describe('design tokens', () => {
  it('defines every color the app uses', () => {
    for (const name of [
      'bg', 'surface', 'surface-raised', 'border', 'text', 'text-muted', 'primary', 'on-primary',
      'accent-text', 'cyan', 'amber', 'success', 'danger', 'focus', 'code-bg', 'code-text', 'code-muted',
    ]) {
      expect(tokens[name], `--${name} is missing`).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  // WCAG AA: 4.5:1 for normal text, 3:1 for large text and UI outlines.
  const textPairs: [string, string][] = [
    ['text', 'bg'], ['text', 'surface'], ['text', 'surface-raised'],
    ['text-muted', 'bg'], ['text-muted', 'surface'], ['text-muted', 'surface-raised'],
    ['on-primary', 'primary'],
    ['accent-text', 'bg'], ['accent-text', 'surface'],
    ['cyan', 'surface'], ['amber', 'surface'], ['success', 'surface'], ['danger', 'surface'],
    ['code-text', 'code-bg'], ['code-muted', 'code-bg'],
  ]
  it.each(textPairs)('%s on %s has AA text contrast (4.5:1)', (fg, bg) => {
    expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(4.5)
  })

  it.each(['bg', 'surface', 'surface-raised'])('the focus ring is visible on %s (3:1)', (bg) => {
    expect(contrast(tokens.focus, tokens[bg])).toBeGreaterThanOrEqual(3)
  })
})
