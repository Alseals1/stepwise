import { numberListEditor } from '../../engine/inputs'
import type { Topic } from '../../engine/types'
import { code } from './code'
import { record } from './record'

/** Its id matches the "map-filter-reduce" stage on the map. */
export const mapFilterReduce: Topic<number[]> = {
  id: 'map-filter-reduce',
  title: 'map, filter and reduce',
  code,
  // Filter keeps two items and find stops on the third, so "find stops early" shows.
  defaultInput: [3, 4, 8, 5, 12],
  record,
  inputEditor: numberListEditor({ label: 'List', maxLength: 6, min: -99, max: 99 }),
}
