import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { bundledLanguages } from 'shiki/langs'
import { bundledThemes } from 'shiki/themes'
import type { Language } from './types'

export interface Token {
  content: string
  color?: string
}

// catppuccin-mocha matches the app's code colors (#1e1e2e background, #cdd6f4 text).
const THEME = 'catppuccin-mocha'
const LANGS: Record<Language, 'javascript' | 'typescript'> = { js: 'javascript', ts: 'typescript' }

let highlighter: Promise<HighlighterCore> | undefined

function getHighlighter() {
  highlighter ??= createHighlighterCore({
    themes: [bundledThemes[THEME]],
    langs: [bundledLanguages.javascript, bundledLanguages.typescript],
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
