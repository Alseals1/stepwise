import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getEntry } from '../topics/registry'
import { InputPanel } from './InputPanel'

const editor = getEntry('sum-demo')!.editor!
const field = () => screen.getByRole('textbox', { name: 'Numbers' })

function view() {
  const onRun = vi.fn()
  render(<InputPanel editor={editor} onRun={onRun} />)
  return onRun
}

describe('InputPanel', () => {
  it('has a heading, a labelled field with the example in it, and a hint', () => {
    view()
    expect(screen.getByRole('heading', { level: 2, name: 'Try your own numbers' })).toBeInTheDocument()
    expect(field()).toHaveValue('2, 4, 6')
    expect(field()).toHaveAccessibleDescription(/Up to 8 whole numbers from -99 to 99/)
  })

  it('has Apply, Random and Reset buttons, and is a target for the tour', () => {
    view()
    for (const name of ['Apply', 'Random', 'Reset']) expect(screen.getByRole('button', { name })).toBeInTheDocument()
    expect(document.querySelector('[data-tour="input"]')).toContainElement(field())
  })

  it('runs the learner’s numbers when Apply is pressed, and tidies what the field shows', async () => {
    const user = userEvent.setup()
    const onRun = view()
    await user.clear(field())
    await user.type(field(), '5;10  7')
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onRun).toHaveBeenCalledTimes(1)
    expect(onRun.mock.calls[0][0].text).toBe('5, 10, 7')
    expect(onRun.mock.calls[0][0].frames[0].say).toBe('Call sum with [5, 10, 7].')
    expect(field()).toHaveValue('5, 10, 7')
  })

  it('applies with the Enter key', async () => {
    const user = userEvent.setup()
    const onRun = view()
    await user.clear(field())
    await user.type(field(), '3, 1{Enter}')
    expect(onRun).toHaveBeenCalledTimes(1)
    expect(onRun.mock.calls[0][0].text).toBe('3, 1')
  })

  it('runs an empty field as an empty list', async () => {
    const user = userEvent.setup()
    const onRun = view()
    await user.clear(field())
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onRun.mock.calls[0][0].frames).toHaveLength(3)
  })

  it('says what is wrong with bad input, marks the field, and changes nothing', async () => {
    const user = userEvent.setup()
    const onRun = view()
    await user.clear(field())
    await user.type(field(), '1, two')
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(screen.getByText('"two" isn’t a number.')).toBeInTheDocument()
    expect(field()).toHaveAttribute('aria-invalid', 'true')
    expect(field()).toHaveAccessibleDescription(/"two" isn.t a number/)
    expect(field()).toHaveValue('1, two') // what they typed is left for them to fix
    expect(onRun).not.toHaveBeenCalled()
  })

  it('clears the message as soon as the learner edits the field', async () => {
    const user = userEvent.setup()
    view()
    await user.clear(field())
    await user.type(field(), '999')
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(screen.getByText(/between -99 and 99/)).toBeInTheDocument()
    await user.type(field(), '1')
    expect(screen.queryByText(/between -99 and 99/)).not.toBeInTheDocument()
    expect(field()).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('Random fills in a fresh example and runs it', async () => {
    const user = userEvent.setup()
    const onRun = view()
    await user.click(screen.getByRole('button', { name: 'Random' }))
    expect(onRun).toHaveBeenCalledTimes(1)
    const run = onRun.mock.calls[0][0]
    expect(field()).toHaveValue(run.text)
    expect(editor.apply(run.text)).toEqual({ ok: true, run })
  })

  it('Reset goes back to the example, clears any message and runs it', async () => {
    const user = userEvent.setup()
    const onRun = view()
    await user.clear(field())
    await user.type(field(), 'abc')
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(field()).toHaveValue('2, 4, 6')
    expect(screen.queryByText(/isn.t a number/)).not.toBeInTheDocument()
    expect(onRun).toHaveBeenCalledTimes(1)
    expect(onRun.mock.calls[0][0]).toEqual(editor.example)
  })

  it('announces messages politely, in a region that is always there, without a status role', () => {
    const { container } = render(<InputPanel editor={editor} onRun={() => {}} />)
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
