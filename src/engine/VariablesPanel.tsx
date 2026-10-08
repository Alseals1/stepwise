import type { VarValue } from './types'

/** Formats a value the way you would write it in code. */
export function formatValue(value: VarValue): string {
  if (Array.isArray(value)) return `[${value.map(formatValue).join(', ')}]`
  if (typeof value === 'string') return JSON.stringify(value)
  return String(value)
}

export function VariablesPanel({ vars }: { vars: Record<string, VarValue> }) {
  const entries = Object.entries(vars)
  return (
    <section className="variables-panel" aria-label="Variables">
      <h2>Variables</h2>
      {entries.length === 0 ? (
        <p>No variables yet</p>
      ) : (
        <dl>
          {entries.map(([name, value]) => (
            <div key={name} className="variable">
              <dt>{name}</dt>
              <dd>{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
