import { defineConfig, devices } from '@playwright/test'

// Every test starts with the first-visit tour already seen, so it never gets in the way.
// The tour spec overrides this with an empty browser.
const SEEN_TOUR_STATE = {
  version: 1,
  completed: {},
  unlockAll: false,
  runs: {},
  settings: { language: 'js', speed: 1 },
  streak: { current: 0, longest: 0, lastStudyDay: null, freezeUsedWeek: null },
  badges: {},
  help: { tourSeen: true },
}

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  // Failure screenshots go to the git-ignored test-results/ folder. Never commit them.
  use: {
    baseURL: 'http://localhost:5173',
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:5173',
          localStorage: [{ name: 'stepwise:v1', value: JSON.stringify(SEEN_TOUR_STATE) }],
        },
      ],
    },
    screenshot: 'only-on-failure',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Phone-sized viewport, still Chromium (no WebKit needed).
    { name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
  ],
})
