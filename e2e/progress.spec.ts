import { expect, test } from '@playwright/test'
import { hud, passQuiz, setDay } from './helpers'

const warmUp = (page: import('@playwright/test').Page) =>
  page.getByRole('listitem', { name: 'Warm-up: Add up the numbers' })

test.beforeEach(async ({ page }) => {
  await setDay(page, '2026-10-08')
})

test('stars, language, speed and unlock-all survive a reload', async ({ page }) => {
  await page.goto('/#/topic/sum-demo')
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  await page.getByRole('button', { name: 'TS' }).click()
  await page.getByRole('slider', { name: 'Speed' }).fill('3')
  await passQuiz(page)
  await expect(page.getByText('You got 3 of 3.')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  await expect(page.getByRole('button', { name: 'TS' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('slider', { name: 'Speed' })).toHaveValue('3')

  await page.getByRole('link', { name: /back to the map/i }).click()
  await expect(warmUp(page)).toContainText('Completed')
  await expect(warmUp(page).getByRole('img', { name: '3 of 3 stars' })).toBeVisible()

  await page.getByRole('switch', { name: 'Unlock all topics' }).check()
  await page.reload()
  await expect(page.getByRole('switch', { name: 'Unlock all topics' })).toBeChecked()
  await expect(warmUp(page).getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
})

test('Reset progress asks first, clears progress and keeps settings', async ({ page }) => {
  await page.goto('/#/topic/sum-demo')
  await page.getByRole('button', { name: 'TS' }).click()
  await passQuiz(page)
  await page.getByRole('link', { name: /back to the map/i }).click()
  await expect(warmUp(page)).toContainText('Completed')

  await page.getByRole('button', { name: 'Reset progress' }).click()
  await expect(page.getByText(/Your settings stay/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(warmUp(page)).toContainText('Completed')

  await page.getByRole('button', { name: 'Reset progress' }).click()
  await page.getByRole('button', { name: 'Yes, reset' }).click()
  await expect(warmUp(page)).not.toContainText('Completed')
  await expect(hud(page).getByText('Start a streak')).toBeVisible()
  await expect(hud(page).getByRole('link', { name: '0 of 9 badges' })).toBeVisible()

  await warmUp(page).getByRole('link').click()
  await expect(page.getByRole('button', { name: 'TS' })).toHaveAttribute('aria-pressed', 'true')
})

test('the app works and says so when the browser blocks storage', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('blocked', 'SecurityError')
      },
    })
  })
  await page.goto('/')
  await expect(page.getByText(/progress can.t be saved in this browser/i)).toBeVisible()
  await page.getByRole('link', { name: /Warm-up/ }).click()
  await passQuiz(page)
  await expect(page.getByText('You got 3 of 3.')).toBeVisible()
  await expect(hud(page).getByText('1-day streak')).toBeVisible()
})

test('a browser that refuses writes shows the notice after the first change', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError')
    }
  })
  await page.goto('/')
  await expect(page.getByText(/can.t be saved/i)).toHaveCount(0)
  await page.getByRole('switch', { name: 'Unlock all topics' }).check()
  await expect(page.getByText(/can.t be saved/i)).toBeVisible()
  await expect(page.getByRole('switch', { name: 'Unlock all topics' })).toBeChecked()
})

test('corrupted saved data is ignored and the app starts fresh', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('stepwise:v1', '{oops'))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Your path' })).toBeVisible()
  await expect(hud(page).getByText('Start a streak')).toBeVisible()
  await expect(page.getByText(/can.t be saved/i)).toHaveCount(0)
})

test('saved data with the wrong shape is cleaned up rather than crashing', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'stepwise:v1',
      JSON.stringify({
        version: 1,
        completed: { 'sum-demo': { stars: 2 }, junk: { stars: 99 } },
        settings: { language: 'cobol', speed: 'warp' },
        streak: 'nonsense',
        badges: { 'first-run': '2026-10-06', fake: 12 },
      }),
    ),
  )
  await page.goto('/')
  await expect(warmUp(page).getByRole('img', { name: '2 of 3 stars' })).toBeVisible()
  await expect(hud(page).getByRole('link', { name: '1 of 9 badges' })).toBeVisible()
  await warmUp(page).getByRole('link').click()
  await expect(page.getByRole('button', { name: 'JS' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('slider', { name: 'Speed' })).toHaveValue('1')
})
