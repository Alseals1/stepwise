import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { copyText, downloadText } from './browser'

describe('downloadText', () => {
  let click: ReturnType<typeof vi.spyOn>
  let clicked: { download: string; href: string; inDocument: boolean } | undefined

  beforeEach(() => {
    vi.useFakeTimers()
    clicked = undefined
    URL.createObjectURL = vi.fn(() => 'blob:fake')
    URL.revokeObjectURL = vi.fn()
    click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked = { download: this.download, href: this.href, inDocument: document.body.contains(this) }
    })
  })
  afterEach(() => {
    vi.useRealTimers()
    click.mockRestore()
  })

  it('saves the text as a named JSON file through a temporary link', async () => {
    downloadText('backup.json', '{"a":1}')
    expect(clicked).toEqual({ download: 'backup.json', href: 'blob:fake', inDocument: true })
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob
    expect(blob.type).toBe('application/json')
    expect(await blob.text()).toBe('{"a":1}')
  })

  it('cleans up the link, and the object URL a moment later', () => {
    downloadText('backup.json', '{}')
    expect(document.querySelector('a[download]')).toBeNull()
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake')
  })
})

describe('copyText', () => {
  const setClipboard = (value: unknown) =>
    Object.defineProperty(navigator, 'clipboard', { value, configurable: true })
  afterEach(() => setClipboard(undefined))

  it('writes to the clipboard and says it worked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    expect(await copyText('hello')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('says it failed when the browser refuses', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')) })
    expect(await copyText('hello')).toBe(false)
  })

  it('says it failed when there is no clipboard', async () => {
    setClipboard(undefined)
    expect(await copyText('hello')).toBe(false)
  })
})
