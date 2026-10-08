import type { Frame, Topic, TopicCode } from '../engine/types'
import { sumDemo } from './sum-demo'
import { content as sumDemoContent } from './sum-demo/content'
import type { TopicContent } from './types'

/** Everything a topic page needs: recorded frames, code and text. */
export interface TopicEntry {
  id: string
  frames: Frame[]
  code: TopicCode
  content: TopicContent
}

function entry<Input>(topic: Topic<Input>, content: TopicContent): TopicEntry {
  return { id: topic.id, frames: topic.record(topic.defaultInput), code: topic.code, content }
}

/** Adding a topic: build it, add its content, register it here, and set `available` in stages.ts. */
export const entries: TopicEntry[] = [entry(sumDemo, sumDemoContent)]

export const getEntry = (id: string): TopicEntry | undefined => entries.find((e) => e.id === id)
