import { expect, test, type Page } from '@playwright/test'
import { finishRun, hud, passQuiz, setDay } from './helpers'

const badge = (page: Page, title: string) => page.getByRole('listitem', { name: title })

test.beforeEach(async ({ page }) => {
  await setDay(page, '2026-10-08')
})

test('playing an animation to the end unlocks First Run with a toast you can dismiss', async ({ page }) => {
  await finishRun(page)
  await expect(page.getByText('Badge unlocked: First Run')).toBeVisible()
  await expect(hud(page).getByRole('link', { name: '1 of 9 badges' })).toBeVisible()

  await page.getByRole('button', { name: 'Dismiss First Run toast' }).click()
  await expect(page.getByText('Badge unlocked: First Run')).toHaveCount(0)
})

test('the toast goes away by itself', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-08T10:00:00') })
  await finishRun(page)
  await expect(page.getByText('Badge unlocked: First Run')).toBeVisible()
  await page.clock.fastForward(7000)
  await expect(page.getByText('Badge unlocked: First Run')).toHaveCount(0)
})

test('a perfect quiz unlocks First Quiz and Perfect Score, and the badges page shows them with the date', async ({
  page,
}) => {
  await finishRun(page)
  await passQuiz(page)
  await expect(page.getByText('Badge unlocked: First Quiz')).toBeVisible()
  await expect(page.getByText('Badge unlocked: Perfect Score')).toBeVisible()

  await hud(page).getByRole('link', { name: '3 of 9 badges' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Badges' })).toBeFocused()
  await expect(page.getByText('3 of 9 earned')).toBeVisible()
  for (const title of ['First Run', 'First Quiz', 'Perfect Score']) {
    await expect(badge(page, title)).toHaveAttribute('data-earned', 'true')
    await expect(badge(page, title)).toContainText('Earned Oct 8, 2026')
  }
})

test('locked badges say how to earn them, and topic badges say when their topic is not built yet', async ({ page }) => {
  await page.goto('/#/badges')
  await expect(page.getByRole('listitem')).toHaveCount(9)
  await expect(page.getByText('0 of 9 earned')).toBeVisible()
  await expect(badge(page, 'First Run')).toContainText('Locked. Play any animation to its last step.')
  await expect(badge(page, 'Hidden Loop Spotter')).toContainText('Complete "The hidden loop".')
  await expect(badge(page, 'Hidden Loop Spotter')).toContainText("This topic isn't built yet.")
  await expect(badge(page, 'First Run')).not.toContainText("This topic isn't built yet.")
})

test('a 7-day streak earns the 3-day and 7-day badges on the right days', async ({ page }) => {
  const days = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']
  for (const [i, day] of days.entries()) {
    await setDay(page, day)
    await finishRun(page)
    if (i === 2) await expect(page.getByText('Badge unlocked: 3-Day Streak')).toBeVisible()
    if (i === 6) await expect(page.getByText('Badge unlocked: 7-Day Streak')).toBeVisible()
  }
  await page.goto('/#/badges')
  await expect(badge(page, '3-Day Streak')).toContainText('Earned Oct 7, 2026')
  await expect(badge(page, '7-Day Streak')).toContainText('Earned Oct 11, 2026')
  await expect(page.getByText('3 of 9 earned')).toBeVisible()
})

test('keyboard only: Tab to the badges link and Enter opens the page with focus on its heading', async ({ page }) => {
  await page.goto('/')
  await hud(page).getByRole('link', { name: /badges/ }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: 'Badges' })).toBeFocused()
  await page.getByRole('link', { name: /back to the map/i }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Your path' })).toBeVisible()
})

test('the badges page does not scroll sideways', async ({ page }) => {
  await page.goto('/#/badges')
  await expect(page.getByRole('heading', { level: 1, name: 'Badges' })).toBeVisible()
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflows).toBe(false)
})
