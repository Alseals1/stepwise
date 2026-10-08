import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStepperKeys } from './useStepperKeys'

const handlers = { next: vi.fn(), back: vi.fn(), restart: vi.fn(), togglePlay: vi.fn() }

function Harness() {
  useStepperKeys(handlers)
  return (
    <div>
      <button>a button</button>
      <input aria-label="text" />
      <input aria-label="speed" type="range" />
      <select aria-label="choice">
        <option>one</option>
      </select>
    </div>
  )
}

beforeEach(() => Object.values(handlers).forEach((fn) => fn.mockClear()))

describe('useStepperKeys', () => {
  it('maps arrows, Space and R to the stepper', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowLeft}')
    await user.keyboard(' ')
    await user.keyboard('r')
    await user.keyboard('R')
    expect(handlers.next).toHaveBeenCalledTimes(1)
    expect(handlers.back).toHaveBeenCalledTimes(1)
    expect(handlers.togglePlay).toHaveBeenCalledTimes(1)
    expect(handlers.restart).toHaveBeenCalledTimes(2)
  })

  it.each(['text', 'speed', 'choice'])('is ignored while the %s control has focus', async (label) => {
    const user = userEvent.setup()
    const { getByLabelText } = render(<Harness />)
    getByLabelText(label).focus()
    await user.keyboard('{ArrowRight}{ArrowLeft}r')
    expect(handlers.next).not.toHaveBeenCalled()
    expect(handlers.back).not.toHaveBeenCalled()
    expect(handlers.restart).not.toHaveBeenCalled()
  })

  it('lets a focused button keep its own Space action', async () => {
    const user = userEvent.setup()
    const { getByRole } = render(<Harness />)
    getByRole('button', { name: 'a button' }).focus()
    await user.keyboard(' ')
    expect(handlers.togglePlay).not.toHaveBeenCalled()
  })

  it('still handles arrows when a button has focus', async () => {
    const user = userEvent.setup()
    const { getByRole } = render(<Harness />)
    getByRole('button', { name: 'a button' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(handlers.next).toHaveBeenCalledTimes(1)
  })

  it('ignores shortcuts combined with Ctrl, Meta or Alt (so Cmd+R still reloads)', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.keyboard('{Meta>}r{/Meta}')
    await user.keyboard('{Control>}{ArrowRight}{/Control}')
    expect(handlers.restart).not.toHaveBeenCalled()
    expect(handlers.next).not.toHaveBeenCalled()
  })

  it('stops listening after unmount', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Harness />)
    unmount()
    await user.keyboard('{ArrowRight}')
    expect(handlers.next).not.toHaveBeenCalled()
  })
})
