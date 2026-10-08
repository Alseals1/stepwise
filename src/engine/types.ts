export type VarValue = string | number | boolean | null | undefined | VarValue[]

/** How an array box is styled in a frame. */
export type Mark = 'current' | 'compare' | 'done' | 'dim' | 'mismatch'

/** A labelled row of boxes, for topics that show more than one array at once. */
export interface Row {
  label: string
  values: number[]
  marks?: Record<number, Mark>
  /** Shown under each box instead of its position, such as the index a Map maps each value to. */
  indexes?: number[]
}

/** What is happening to a box in a seat row. */
export type SeatMark = 'new' | 'moving' | 'removed'

/** One box in a row of numbered seats. The `id` stays the same for the same element across frames. */
export interface Seat {
  id: number
  value: number
  /** The seat (0-based) the box sits in. Changing it between frames makes the box glide. */
  seat: number
  mark?: SeatMark
}

/** A "what happens next?" question, asked before this frame is revealed (in predict mode). */
export interface Ask {
  question: string
  options: string[]
  /** Zero-based index of the right option. */
  answer: number
  /** One sentence on why, shown after the answer. */
  explain: string
}

/** A named position in a list, such as `left` or `right`, shown as a tag under its box. */
export interface Pointer {
  label: string
  index: number
}

/** One snapshot of everything the screen needs at one moment. */
export interface Frame {
  /** 1-based line in the topic's code. The JS and TS versions share line numbers. */
  line: number
  vars: Record<string, VarValue>
  /** One sentence: what happens and why. */
  say: string
  /** Numbers, or single characters for a word. */
  array?: (string | number)[]
  marks?: Record<number, Mark>
  /** Named positions in `array`, shown under their boxes. Give it (even empty) in every frame of a run that uses it. */
  pointers?: Pointer[]
  /**
   * How many tag lines every box keeps room for under it (default 1). Set it to the most tags that can
   * land on one box, so the boxes do not grow when several pointers meet. Keep it the same in every frame of a run.
   */
  pointerSlots?: number
  /** Several labelled rows of boxes, for topics that show more than one array. Shown instead of `array`. */
  rows?: Row[]
  /** Boxes in numbered seats, for topics about positions and moving. Shown instead of `array`. */
  seats?: Seat[]
  /** How many seats the row has. Keep it the same in every frame of a run. */
  seatCount?: number
  /** Asked before this frame is shown when predict mode is on. Never on the first frame. */
  ask?: Ask
}

import type { InputEditor } from './inputs'

export type Language = 'js' | 'ts'

export interface TopicCode {
  js: string
  ts: string
}

/** A classic mistake a topic can replay: the same algorithm with a bug, ending visibly wrong. */
export interface Bug<Input> {
  id: string
  /** Short button text, such as "`.has` on the array". */
  label: string
  /** The broken code. JS and TS must have the same number of lines, as for a topic. */
  code: TopicCode
  /** Pure, like a topic's record(). Frames carry no `ask`, and describe a crash instead of throwing. */
  record: (input: Input) => Frame[]
  /** One sentence on why it goes wrong. */
  why: string
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
  /** Classic mistakes the learner can replay under the player. */
  bugs?: Bug<Input>[]
}
