import { describe, expect, it } from 'vitest'
import { parseRoute, topicPath } from './parseRoute'

describe('parseRoute', () => {
  it.each(['', '#', '#/', '/'])('treats %j as the home page', (hash) => {
    expect(parseRoute(hash)).toEqual({ name: 'home' })
  })

  it.each(['#/badges', '#/badges/'])('reads %j as the badges page', (hash) => {
    expect(parseRoute(hash)).toEqual({ name: 'badges' })
  })

  it.each(['#/how-to', '#/how-to/'])('reads %j as the How-to page', (hash) => {
    expect(parseRoute(hash)).toEqual({ name: 'how-to' })
  })

  it('reads a topic id', () => {
    expect(parseRoute('#/topic/sum-demo')).toEqual({ name: 'topic', id: 'sum-demo' })
  })

  it('ignores a trailing slash', () => {
    expect(parseRoute('#/topic/two-pointers/')).toEqual({ name: 'topic', id: 'two-pointers' })
  })

  it.each(['#/topic', '#/topic/', '#/topic/a/b', '#/topic/Has Space', '#/topic/UPPER', '#/nope', '#/topics/x', '#topic/x'])(
    'treats %j as not found',
    (hash) => {
      expect(parseRoute(hash)).toEqual({ name: 'not-found' })
    },
  )
})

describe('topicPath', () => {
  it('builds the path that parseRoute reads back', () => {
    expect(topicPath('binary-search')).toBe('/topic/binary-search')
    expect(parseRoute(`#${topicPath('binary-search')}`)).toEqual({ name: 'topic', id: 'binary-search' })
  })
})
