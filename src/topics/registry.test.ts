import { describe, expect, it } from 'vitest'
import { numberListEditor } from '../engine/inputs'
import type { Frame, Topic } from '../engine/types'
import { getEntry, makeEntry } from './registry'
import { content } from './sum-demo/content'

const warmUp = getEntry('sum-demo')!
const editor = warmUp.editor!

describe('the warm-up entry', () => {
  it('has an editor, with the example as its starting text and frames', () => {
    expect(editor).toBeDefined()
    expect(editor.label).toBe('Numbers')
    expect(editor.hint).toBe('Up to 8 whole numbers from -99 to 99, separated by commas or spaces.')
    expect(editor.example.text).toBe('2, 4, 6')
    expect(editor.example.frames).toEqual(warmUp.frames)
    expect(warmUp.frames).toHaveLength(9)
  })

  it('records a run on the learner’s own numbers', () => {
    const result = editor.apply('5, 10')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.run.text).toBe('5, 10')
    expect(result.run.frames).toHaveLength(7) // 2 setup, 2 per number, 1 return
    expect(result.run.frames[0].say).toBe('Call sum with [5, 10].')
    expect(result.run.frames.at(-1)?.vars.total).toBe(15)
  })

  it('tidies the text it gives back, so the field shows what actually ran', () => {
    const result = editor.apply('  5 ;10,,007 ')
    expect(result.ok && result.run.text).toBe('5, 10, 7')
  })

  it('accepts an empty list', () => {
    const result = editor.apply('')
    expect(result.ok && result.run.frames).toHaveLength(3)
    expect(result.ok && result.run.text).toBe('')
  })

  it('reports why bad input was refused, and records nothing', () => {
    expect(editor.apply('abc')).toEqual({ ok: false, message: '"abc" isn’t a number.' })
    expect(editor.apply('1, 2, 300')).toEqual({ ok: false, message: 'Numbers must be between -99 and 99 (found 300).' })
  })

  it('makes a random run whose text applies back to the same frames', () => {
    for (let i = 0; i < 20; i++) {
      const random = editor.random()
      const again = editor.apply(random.text)
      expect(again.ok && again.run.frames).toEqual(random.frames)
    }
  })

  it('produces the same frames each time for the same text', () => {
    const a = editor.apply('3, 1, 4')
    const b = editor.apply('3, 1, 4')
    expect(a).toEqual(b)
  })

  it('does not carry state between runs', () => {
    const first = editor.apply('9, 9')
    const second = editor.apply('1')
    expect(second.ok && second.run.frames).toHaveLength(5)
    expect(first.ok && first.run.frames).toHaveLength(7)
  })
})

describe('makeEntry', () => {
  const frames = (n: number): Frame[] => Array.from({ length: n }, (_, i) => ({ line: 1, vars: { i }, say: `s${i}` }))
  const base = { id: 'x', title: 'X', code: { js: 'a', ts: 'a' }, defaultInput: 3 }

  it('has no editor for a topic without one', () => {
    const topic: Topic<number> = { ...base, record: (n) => frames(n) }
    const entry = makeEntry(topic, content)
    expect(entry.editor).toBeUndefined()
    expect(entry.frames).toHaveLength(3)
  })

  it('works for any input type through the topic’s own editor', () => {
    const listTopic: Topic<number[]> = {
      ...base,
      defaultInput: [1, 2],
      record: (list) => frames(list.length),
      inputEditor: numberListEditor({ label: 'List', maxLength: 3, min: 0, max: 9 }),
    }
    const entry = makeEntry(listTopic, content)
    expect(entry.editor?.example.text).toBe('1, 2')
    const ok = entry.editor!.apply('4 5 6')
    expect(ok.ok && ok.run.frames).toHaveLength(3)
    expect(entry.editor!.apply('1 2 3 4')).toEqual({ ok: false, message: 'Use at most 3 numbers (you entered 4).' })
  })
})

describe('entry bugs', () => {
  const frames = (n: number): Frame[] => Array.from({ length: n }, (_, i) => ({ line: 1, vars: { i }, say: `s${i}` }))
  const code = { js: 'a\nb', ts: 'a\nb' }
  const listTopic: Topic<number[]> = {
    id: 'x',
    title: 'X',
    code: { js: 'a', ts: 'a' },
    defaultInput: [1, 2],
    record: (list) => frames(list.length),
    inputEditor: numberListEditor({ label: 'List', maxLength: 5, min: 0, max: 9 }),
    bugs: [{ id: 'b', label: 'A bug', code, record: (list) => frames(list.length + 10), why: 'Because.' }],
  }

  it('has no bugs for a topic without them', () => {
    expect(getEntry('sum-demo')!.bugs).toBeUndefined()
    expect(makeEntry({ ...listTopic, bugs: undefined }, content).bugs).toBeUndefined()
  })

  it('exposes a topic’s bugs, and records them on the learner’s list text', () => {
    const entry = makeEntry(listTopic, content)
    expect(entry.bugs).toHaveLength(1)
    expect(entry.bugs![0]).toMatchObject({ id: 'b', label: 'A bug', code, why: 'Because.' })
    expect(entry.bugs![0].record('4 5 6')).toHaveLength(13)
  })

  it('falls back to the default input when the text is missing or does not parse', () => {
    const bug = makeEntry(listTopic, content).bugs![0]
    expect(bug.record()).toHaveLength(12)
    expect(bug.record('nonsense')).toHaveLength(12)
  })

  it('the duplicate check offers its three bugs', () => {
    expect(getEntry('has-duplicate')!.bugs!.map((b) => b.id)).toEqual(['has-on-array', 'index-not-item', 'no-add'])
  })
})
