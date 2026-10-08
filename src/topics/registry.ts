import type { Frame, Topic, TopicCode } from '../engine/types'
import { arrayBasics } from './array-basics'
import { content as arrayBasicsContent } from './array-basics/content'
import { binarySearch } from './binary-search'
import { content as binarySearchContent } from './binary-search/content'
import { hashMapTwoSum } from './hash-map-two-sum'
import { content as hashMapTwoSumContent } from './hash-map-two-sum/content'
import { hasDuplicate } from './has-duplicate'
import { content as hasDuplicateContent } from './has-duplicate/content'
import { hiddenLoop } from './hidden-loop'
import { content as hiddenLoopContent } from './hidden-loop/content'
import { mapFilterReduce } from './map-filter-reduce'
import { content as mapFilterReduceContent } from './map-filter-reduce/content'
import { palindrome } from './palindrome'
import { content as palindromeContent } from './palindrome/content'
import { twoPointers } from './two-pointers'
import { content as twoPointersContent } from './two-pointers/content'
import { sumDemo } from './sum-demo'
import { content as sumDemoContent } from './sum-demo/content'
import type { TopicContent } from './types'

/** One run: the text shown in the input field, and the frames it records. */
export interface Run {
  text: string
  frames: Frame[]
}

/** A topic's input editor with its input type hidden, so the page can use any topic the same way. */
export interface EntryEditor {
  label: string
  hint: string
  /** The built-in example. */
  example: Run
  /** Records a run on the learner's text, or says why it can't. */
  apply: (text: string) => { ok: true; run: Run } | { ok: false; message: string }
  random: () => Run
  /** Boundary inputs, as text. Tests run the topic on all of them. */
  extremes: string[]
}

/** Everything a topic page needs: recorded frames, code and text. */
export interface TopicEntry {
  id: string
  frames: Frame[]
  code: TopicCode
  content: TopicContent
  editor?: EntryEditor
}

export function makeEntry<Input>(topic: Topic<Input>, content: TopicContent): TopicEntry {
  const example = topic.record(topic.defaultInput)
  const inputEditor = topic.inputEditor
  const toRun = (value: Input): Run => ({ text: inputEditor!.format(value), frames: topic.record(value) })

  const editor: EntryEditor | undefined = inputEditor && {
    label: inputEditor.label,
    hint: inputEditor.hint,
    example: { text: inputEditor.format(topic.defaultInput), frames: example },
    apply(text) {
      const parsed = inputEditor.parse(text)
      return parsed.ok ? { ok: true, run: toRun(parsed.value) } : { ok: false, message: parsed.message }
    },
    random: () => toRun(inputEditor.random()),
    extremes: inputEditor.extremes().map(inputEditor.format),
  }
  return { id: topic.id, frames: example, code: topic.code, content, editor }
}

/** Adding a topic: build it, add its content, register it here, and set `available` in stages.ts. */
export const entries: TopicEntry[] = [
  makeEntry(sumDemo, sumDemoContent),
  makeEntry(arrayBasics, arrayBasicsContent),
  makeEntry(mapFilterReduce, mapFilterReduceContent),
  makeEntry(hiddenLoop, hiddenLoopContent),
  makeEntry(hasDuplicate, hasDuplicateContent),
  makeEntry(twoPointers, twoPointersContent),
  makeEntry(palindrome, palindromeContent),
  makeEntry(binarySearch, binarySearchContent),
  makeEntry(hashMapTwoSum, hashMapTwoSumContent),
]

export const getEntry = (id: string): TopicEntry | undefined => entries.find((e) => e.id === id)
