import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStepperKeys } from './useStepperKeys'

const handlers = { next: vi.fn(), back: vi.fn(), restart: vi.fn(), togglePlay: vi.fn(), choose: vi.fn() }

function Harness() {
  useStepperKeys(handlers)
  return (
    <div>
      <button>a button</button>
      <input aria-label="text" />
      <input aria-label="speed" type="range" />
      <input aria-label="mode switch" type="checkbox" role="switch" />
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

  it('keeps working while a checkbox switch has focus, so toggling Predict mode does not break the keys', async () => {
    const user = userEvent.setup()
    const { getByLabelText } = render(<Harness />)
    getByLabelText('mode switch').focus()
    await user.keyboard('{ArrowRight}{ArrowLeft}r1')
    expect(handlers.next).toHaveBeenCalledTimes(1)
    expect(handlers.back).toHaveBeenCalledTimes(1)
    expect(handlers.restart).toHaveBeenCalledTimes(1)
    expect(handlers.choose).toHaveBeenCalledWith(0)
  })

  it('leaves Space to a focused checkbox, so it toggles the switch instead of playing', async () => {
    const user = userEvent.setup()
    const { getByLabelText } = render(<Harness />)
    getByLabelText('mode switch').focus()
    await user.keyboard(' ')
    expect(handlers.togglePlay).not.toHaveBeenCalled()
    expect(getByLabelText('mode switch')).toBeChecked()
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

  it('maps the number keys 1 to 4 to picking an answer, counting from zero', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.keyboard('1234')
    expect(handlers.choose.mock.calls).toEqual([[0], [1], [2], [3]])
  })

  it('ignores other digits, and numbers typed into a field', async () => {
    const user = userEvent.setup()
    const { getByLabelText } = render(<Harness />)
    await user.keyboard('059')
    expect(handlers.choose).not.toHaveBeenCalled()
    getByLabelText('text').focus()
    await user.keyboard('1')
    expect(handlers.choose).not.toHaveBeenCalled()
  })

  it('does not take Ctrl or Cmd plus a number (browser tab shortcuts)', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.keyboard('{Meta>}1{/Meta}')
    await user.keyboard('{Control>}2{/Control}')
    expect(handlers.choose).not.toHaveBeenCalled()
  })

  it('still works for callers that do not take answers', async () => {
    const user = userEvent.setup()
    function Plain() {
      useStepperKeys({ next: handlers.next, back: handlers.back, restart: handlers.restart, togglePlay: handlers.togglePlay })
      return null
    }
    render(<Plain />)
    await user.keyboard('1')
    expect(handlers.choose).not.toHaveBeenCalled()
  })

  it('stops listening after unmount', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Harness />)
    unmount()
    await user.keyboard('{ArrowRight}')
    expect(handlers.next).not.toHaveBeenCalled()
  })
})
