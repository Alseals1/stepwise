import { numberListEditor } from '../../engine/inputs'
import type { Topic } from '../../engine/types'
import { code } from './code'
import { record } from './record'

export const sumDemo: Topic<number[]> = {
  id: 'sum-demo',
  title: 'Add up the numbers',
  code,
  defaultInput: [2, 4, 6],
  record,
  inputEditor: numberListEditor({ label: 'Numbers', maxLength: 8, min: -99, max: 99 }),
}
