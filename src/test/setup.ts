import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom has <dialog> but not showModal() or close(). This stand-in covers what the unit tests
// need (open state and the close event). The focus trap and Escape are checked in Playwright.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close() {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

// Vitest globals are off, so React Testing Library can't register its own cleanup.
afterEach(() => {
  cleanup()
  // Progress is saved in localStorage; keep tests independent of each other.
  localStorage.clear()
})
