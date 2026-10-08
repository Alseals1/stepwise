/** The keyboard shortcuts of the step player. The How-to page shows this list, and a test checks it. */
export interface Shortcut {
  action: string
  /** The on-screen button that does the same thing. */
  button: string
  /** How the key is written for people. */
  label: string
  /** The KeyboardEvent key that triggers it. */
  key: string
  handler: 'togglePlay' | 'next' | 'back' | 'restart'
}

export const SHORTCUTS: Shortcut[] = [
  { action: 'Play or pause', button: 'Play / Pause', label: 'Space', key: ' ', handler: 'togglePlay' },
  { action: 'Next step', button: 'Next', label: '→', key: 'ArrowRight', handler: 'next' },
  { action: 'Previous step', button: 'Back', label: '←', key: 'ArrowLeft', handler: 'back' },
  { action: 'Restart', button: 'Restart', label: 'R', key: 'r', handler: 'restart' },
]
