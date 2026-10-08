import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import type { Language } from './types'

export interface Token {
  content: string
  color?: string
}

// Only these two grammars and one theme are imported, so the build doesn't emit chunks for
// every language Shiki supports. catppuccin-mocha matches the app's code colors
// (#1e1e2e background, #cdd6f4 text).
const THEME = 'catppuccin-mocha'
const LANGS: Record<Language, 'javascript' | 'typescript'> = { js: 'javascript', ts: 'typescript' }

let highlighter: Promise<HighlighterCore> | undefined

function getHighlighter() {
  highlighter ??= createHighlighterCore({
    themes: [import('@shikijs/themes/catppuccin-mocha')],
    langs: [import('@shikijs/langs/javascript'), import('@shikijs/langs/typescript')],
    engine: createJavaScriptRegexEngine(),
  })
  return highlighter
}

/** Colored tokens for each line of `code`. The grammar loads once, on first use. */
export async function highlight(code: string, language: Language): Promise<Token[][]> {
  const shiki = await getHighlighter()
  const { tokens } = shiki.codeToTokens(code, { lang: LANGS[language], theme: THEME })
  return tokens.map((line) => line.map(({ content, color }) => ({ content, color })))
}
