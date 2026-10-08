import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest globals are off, so React Testing Library can't register its own cleanup.
afterEach(() => {
  cleanup()
  // Progress is saved in localStorage; keep tests independent of each other.
  localStorage.clear()
})
