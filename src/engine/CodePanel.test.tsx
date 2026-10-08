import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CodePanel } from './CodePanel'
import { highlight, type Token } from './highlighter'

vi.mock('./highlighter', () => ({ highlight: vi.fn() }))

const code = {
  js: 'function sum(numbers) {\n  return 1\n}',
  ts: 'function sum(numbers: number[]) {\n  return 1\n}',
}

const redTokens = (src: string): Token[][] => src.split('\n').map((line) => [{ content: line, color: '#ff0000' }])

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  vi.mocked(highlight).mockReset()
  vi.mocked(highlight).mockImplementation(async (src) => redTokens(src))
})

const renderPanel = (props: Partial<Parameters<typeof CodePanel>[0]> = {}) =>
  render(<CodePanel code={code} language="js" onLanguageChange={() => {}} line={2} {...props} />)

describe('CodePanel', () => {
  it('shows plain text at once, before highlighting has loaded', () => {
    vi.mocked(highlight).mockReturnValue(new Promise(() => {}))
    renderPanel()
    expect(screen.getByText('function sum(numbers) {')).toBeInTheDocument()
    expect(screen.getByText('return 1', { exact: false })).toBeInTheDocument()
  })

  it('marks only the current line with aria-current="step"', () => {
    renderPanel({ line: 2 })
    const current = document.querySelectorAll('[aria-current="step"]')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent('return 1')
  })

  it('moves the current marker when the line changes', () => {
    const { rerender } = renderPanel({ line: 1 })
    expect(document.querySelector('[aria-current="step"]')).toHaveTextContent('function sum')
    rerender(<CodePanel code={code} language="js" onLanguageChange={() => {}} line={3} />)
    expect(document.querySelector('[aria-current="step"]')).toHaveTextContent('}')
  })

  it('shows the code for the chosen language and keeps the same current line', () => {
    const { rerender } = renderPanel({ line: 2 })
    expect(screen.queryByText(/number\[\]/)).not.toBeInTheDocument()
    rerender(<CodePanel code={code} language="ts" onLanguageChange={() => {}} line={2} />)
    expect(screen.getByText(/number\[\]/)).toBeInTheDocument()
    expect(document.querySelector('[aria-current="step"]')).toHaveTextContent('return 1')
  })

  it('has a JS | TS toggle that reports the choice', async () => {
    const user = userEvent.setup()
    const onLanguageChange = vi.fn()
    renderPanel({ onLanguageChange })
    const group = screen.getByRole('group', { name: 'Code language' })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'JS' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'TS' })).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: 'TS' }))
    expect(onLanguageChange).toHaveBeenCalledWith('ts')
  })

  it('colors the tokens once highlighting arrives', async () => {
    renderPanel()
    expect(await screen.findByText('function sum(numbers) {')).toHaveStyle({ color: '#ff0000' })
  })

  it('keeps showing plain code if highlighting fails', async () => {
    const failing = deferred<Token[][]>()
    vi.mocked(highlight).mockReturnValue(failing.promise)
    renderPanel()
    await act(async () => failing.reject(new Error('grammar failed to load')))
    expect(screen.getByText('function sum(numbers) {')).toBeInTheDocument()
  })

  it('ignores a slow highlight result for a language that is no longer shown', async () => {
    const slowJs = deferred<Token[][]>()
    vi.mocked(highlight).mockImplementation((src) => (src === code.js ? slowJs.promise : Promise.resolve(redTokens(src))))
    const { rerender } = renderPanel({ language: 'js' })
    rerender(<CodePanel code={code} language="ts" onLanguageChange={() => {}} line={2} />)
    expect(await screen.findByText(/number\[\]/)).toHaveStyle({ color: '#ff0000' })
    await act(async () => slowJs.resolve(redTokens(code.js)))
    expect(screen.getByText(/number\[\]/)).toBeInTheDocument()
    expect(screen.queryByText('function sum(numbers) {')).not.toBeInTheDocument()
  })
})
