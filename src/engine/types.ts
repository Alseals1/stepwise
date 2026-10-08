export type VarValue = string | number | boolean | null | undefined | VarValue[]

/** How an array box is styled in a frame. */
export type Mark = 'current' | 'done' | 'dim'

/** A "what happens next?" question, asked before this frame is revealed (in predict mode). */
export interface Ask {
  question: string
  options: string[]
  /** Zero-based index of the right option. */
  answer: number
  /** One sentence on why, shown after the answer. */
  explain: string
}

/** One snapshot of everything the screen needs at one moment. */
export interface Frame {
  /** 1-based line in the topic's code. The JS and TS versions share line numbers. */
  line: number
  vars: Record<string, VarValue>
  /** One sentence: what happens and why. */
  say: string
  array?: number[]
  marks?: Record<number, Mark>
  /** Asked before this frame is shown when predict mode is on. Never on the first frame. */
  ask?: Ask
}

import type { InputEditor } from './inputs'

export type Language = 'js' | 'ts'

export interface TopicCode {
  js: string
  ts: string
}

/** A topic only provides code, a default input and a pure record() function. */
export interface Topic<Input> {
  id: string
  title: string
  code: TopicCode
  defaultInput: Input
  record: (input: Input) => Frame[]
  /** Present when the learner may run the topic on their own input. */
  inputEditor?: InputEditor<Input>
}
