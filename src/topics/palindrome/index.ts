import { wordEditor } from '../../engine/wordInputs'
import type { Topic } from '../../engine/types'
import { code } from './code'
import { record } from './record'

/** Its id matches the "palindrome" stage on the map. */
export const palindrome: Topic<string> = {
  id: 'palindrome',
  title: 'Palindrome',
  code,
  // Odd length: three comparisons, a middle letter nobody compares, and a clean true.
  defaultInput: 'racecar',
  record,
  inputEditor: wordEditor({ label: 'Word', maxLength: 12 }),
}
