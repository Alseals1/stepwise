export type VarValue = string | number | boolean | null | undefined | VarValue[]

/** How an array box is styled in a frame. */
export type Mark = 'current' | 'done' | 'dim'

/** One snapshot of everything the screen needs at one moment. */
export interface Frame {
  /** 1-based line in the topic's code. The JS and TS versions share line numbers. */
  line: number
  vars: Record<string, VarValue>
  /** One sentence: what happens and why. */
  say: string
  array?: number[]
  marks?: Record<number, Mark>
}

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
}
