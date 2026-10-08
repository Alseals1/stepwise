export type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string }

/** How a topic lets the learner enter their own input. Pure: easy to test, and the page only calls these. */
export interface InputEditor<T> {
  /** The field's label. */
  label: string
  /** What is allowed, shown under the field. */
  hint: string
  parse: (text: string) => ParseResult<T>
  /** The text that parses back to this value. */
  format: (value: T) => string
  /** A fresh example. `rng` is replaceable for tests. */
  random: (rng?: () => number) => T
}

export interface NumberListOptions {
  label: string
  maxLength: number
  min: number
  max: number
  /** Defaults to 0, which allows an empty list. */
  minLength?: number
}

/** Longer than any sensible list, so it is refused before it is read. */
const MAX_TEXT_LENGTH = 200

const bad = (message: string): ParseResult<never> => ({ ok: false, message })

/** An editor for a list of whole numbers: "2, 4 6;8" becomes [2, 4, 6, 8]. */
export function numberListEditor({ label, maxLength, min, max, minLength = 0 }: NumberListOptions): InputEditor<number[]> {
  const hint =
    minLength > 0
      ? `Between ${minLength} and ${maxLength} whole numbers from ${min} to ${max}, separated by commas or spaces.`
      : `Up to ${maxLength} whole numbers from ${min} to ${max}, separated by commas or spaces.`

  // Random examples stay short and easy to follow: 3 to 6 numbers from 1 to 9 (within the limits).
  const lengthLow = Math.min(Math.max(minLength, 3), maxLength)
  const lengthHigh = Math.min(Math.max(6, minLength), maxLength)
  const valueLow = Math.min(Math.max(min, 1), max)
  const valueHigh = Math.min(max, Math.max(9, valueLow))

  return {
    label,
    hint,

    parse(text) {
      if (text.length > MAX_TEXT_LENGTH) return bad(`That is too long. Use up to ${maxLength} short numbers.`)

      const tokens = text.replace(/−/g, '-').split(/[\s,;]+/).filter(Boolean)
      for (const token of tokens) {
        if (/^-?\d+$/.test(token)) continue
        if (/^\+\d+$/.test(token)) return bad(`Leave out the plus sign in "${token}".`)
        if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(token)) return bad(`"${token}" isn’t a whole number.`)
        return bad(`"${token}" isn’t a number.`)
      }

      if (tokens.length > maxLength) return bad(`Use at most ${maxLength} numbers (you entered ${tokens.length}).`)
      if (tokens.length < minLength) return bad(`Enter at least ${minLength} number${minLength === 1 ? '' : 's'}.`)

      const value = tokens.map((token) => Number(token) || 0) // `|| 0` turns -0 into 0
      const outOfRange = value.find((n) => n < min || n > max)
      if (outOfRange !== undefined) return bad(`Numbers must be between ${min} and ${max} (found ${outOfRange}).`)
      return { ok: true, value }
    },

    format: (value) => value.join(', '),

    random(rng = Math.random) {
      const length = lengthLow + Math.floor(rng() * (lengthHigh - lengthLow + 1))
      return Array.from({ length }, () => valueLow + Math.floor(rng() * (valueHigh - valueLow + 1)))
    },
  }
}
