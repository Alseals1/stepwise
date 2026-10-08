import { useEffect, useState } from 'react'
import { highlight, type Token } from './highlighter'
import type { Language, TopicCode } from './types'

interface Props {
  code: TopicCode
  language: Language
  onLanguageChange: (language: Language) => void
  /** 1-based line to highlight. */
  line: number
}

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'js', label: 'JS' },
  { id: 'ts', label: 'TS' },
]

const plainLines = (source: string): Token[][] => source.split('\n').map((text) => [{ content: text }])

export function CodePanel({ code, language, onLanguageChange, line }: Props) {
  const source = code[language]
  const [highlighted, setHighlighted] = useState<{ source: string; lines: Token[][] } | null>(null)

  useEffect(() => {
    let cancelled = false
    highlight(source, language)
      .then((lines) => {
        if (!cancelled) setHighlighted({ source, lines })
      })
      // If the grammar fails to load, the plain text below is still fully usable.
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [source, language])

  // Tokens only count if they belong to the code on screen right now.
  const lines = highlighted?.source === source ? highlighted.lines : plainLines(source)

  return (
    <div className="code-panel" data-tour="code">
      <div className="code-header">
        <div role="group" aria-label="Code language" className="code-toggle">
          {LANGUAGES.map(({ id, label }) => (
            <button key={id} type="button" aria-pressed={language === id} onClick={() => onLanguageChange(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <pre className="code-body" tabIndex={0} role="region" aria-label="Code">
        <code>
          {lines.map((tokens, i) => (
            <span key={i} className="code-line" aria-current={i + 1 === line ? 'step' : undefined}>
              <span className="code-line-number" aria-hidden="true">
                {i + 1}
              </span>
              {tokens.map((token, j) => (
                <span key={j} style={token.color ? { color: token.color } : undefined}>
                  {token.content}
                </span>
              ))}
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}
