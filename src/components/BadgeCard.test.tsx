import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BADGES } from '../progress/badges'
import { BadgeCard } from './BadgeCard'

const badge = BADGES.find((b) => b.id === 'pointer-pro')!

describe('BadgeCard', () => {
  it('says when the topic the badge needs is not built yet', () => {
    render(
      <ul>
        <BadgeCard badge={badge} topicBuilt={false} />
      </ul>,
    )
    expect(screen.getByText("This topic isn't built yet.")).toBeInTheDocument()
  })

  it('says nothing about it once the topic is built', () => {
    render(
      <ul>
        <BadgeCard badge={badge} topicBuilt />
      </ul>,
    )
    expect(screen.queryByText("This topic isn't built yet.")).not.toBeInTheDocument()
  })
})
