import type { InputEditor } from './inputs'

export interface WordOptions {
  label: string
  maxLength: number
}

/** Longer than any sensible word, so it is refused before it is read. */
const MAX_TEXT_LENGTH = 200

const bad = (message: string) => ({ ok: false as const, message })

const NAMES: Record<string, string> = { ' ': 'space', '\t': 'tab', '\n': 'line break', '\r': 'line break' }

/** Small enough that a random word often has a near-miss, which makes a good mismatch to watch. */
const ALPHABET = 'abcdefgh'

/**
 * An editor for one word of letters (A to Z) and digits. Capitals are read as lowercase, spaces around
 * the word are trimmed, and anything else is refused by name. An empty word is allowed: it is a
 * palindrome by definition.
 */
export function wordEditor({ label, maxLength }: WordOptions): InputEditor<string> {
  const hint = `Up to ${maxLength} letters or digits, with no spaces or punctuation. Capitals are read as lowercase.`

  const randomLetter = (rng: () => number) => ALPHABET[Math.floor(rng() * ALPHABET.length)]
  const lengthLow = Math.min(3, maxLength)
  const lengthHigh = Math.min(9, maxLength)

  return {
    label,
    hint,

    parse(text) {
      if (text.length > MAX_TEXT_LENGTH) return bad(`That is too long. Use up to ${maxLength} characters.`)

      const chars = Array.from(text.trim())
      for (const char of chars) {
        if (/^[a-z0-9]$/i.test(char)) continue
        if (NAMES[char]) return bad(`Letters and digits only: leave out the ${NAMES[char]}.`)
        if (char.charCodeAt(0) < 128) return bad(`Letters and digits only: leave out the "${char}".`)
        return bad(`Letters and digits only: "${char}" is outside A to Z and 0 to 9.`)
      }

      if (chars.length > maxLength) return bad(`Use at most ${maxLength} characters (you entered ${chars.length}).`)
      return { ok: true, value: chars.join('').toLowerCase() }
    },

    format: (value) => value,

    // 3 to 9 letters. Half are palindromes; the rest are a palindrome with one letter changed, so the
    // mismatch lands at a random pair instead of always at the first.
    random(rng = Math.random) {
      const length = lengthLow + Math.floor(rng() * (lengthHigh - lengthLow + 1))
      const half = Array.from({ length: Math.ceil(length / 2) }, () => randomLetter(rng))
      const letters = [...half, ...[...half].reverse().slice(length % 2)]
      if (rng() < 0.5 && length >= 2) {
        const first = Math.ceil(length / 2)
        const at = first + Math.floor(rng() * (length - first))
        const others = ALPHABET.replace(letters[at], '')
        letters[at] = others[Math.floor(rng() * others.length)]
      }
      return letters.join('')
    },

    extremes() {
      const candidates = [
        '', // nothing to compare
        'a', // one character
        'aa',
        'ab', // a mismatch on the only pair
        'abba',
        'racecar',
        'abcdefghijkl'.slice(0, maxLength), // a mismatch at the first pair
        'abcdefgedcba', // the only mismatch is the innermost pair (even length)
        'abcdeba', // ... and with a middle character (odd length)
        'abcdeffedcba', // the longest even palindrome
        'abcdefedcba', // an odd palindrome
        '0'.repeat(maxLength), // all the same
        '1234554321',
      ]
      const seen = new Set<string>()
      return candidates.filter((word) => word.length <= maxLength && !seen.has(word) && !!seen.add(word))
    },
  }
}
