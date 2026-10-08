import { beforeEach, describe, expect, it } from 'vitest'
import { goTo } from './navigate'

beforeEach(() => {
  window.location.hash = ''
})

describe('goTo', () => {
  it('moves to a path by changing the hash, like clicking a Link', () => {
    goTo('/topic/sum-demo')
    expect(window.location.hash).toBe('#/topic/sum-demo')
    goTo('/how-to')
    expect(window.location.hash).toBe('#/how-to')
  })
})
