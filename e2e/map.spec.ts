import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Your path' })).toBeVisible()
})

test('shows the brand, the tagline and the stages', async ({ page }) => {
  const banner = page.getByRole('banner')
  await expect(banner.getByRole('link', { name: 'Stepwise' })).toBeVisible()
  await expect(banner.getByText(/see every step of an algorithm/i)).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(8)
})

test('the warm-up is open, array basics is locked behind it, and planned stages are not clickable', async ({ page }) => {
  const warmUp = page.getByRole('listitem', { name: 'Warm-up: Add up the numbers' })
  await expect(warmUp.getByRole('link')).toBeVisible()
  await expect(warmUp.getByText('Next up')).toBeVisible()
  await expect(page.getByText('Next up')).toHaveCount(1)

  await expect(page.getByRole('list').getByRole('link')).toHaveCount(1)
  await expect(page.getByText('Coming soon')).toHaveCount(6)
  await expect(page.getByRole('listitem', { name: 'Binary search' })).toContainText('Coming soon')
  await expect(page.getByRole('listitem', { name: 'Array basics' })).toContainText(
    'Locked. Finish Warm-up: Add up the numbers to unlock.',
  )
})

test('the Unlock all switch works with the keyboard', async ({ page }) => {
  const toggle = page.getByRole('switch', { name: 'Unlock all topics' })
  await expect(toggle).not.toBeChecked()
  await toggle.focus()
  await page.keyboard.press('Space')
  await expect(toggle).toBeChecked()
  await page.keyboard.press('Space')
  await expect(toggle).not.toBeChecked()
})

test('has no sideways scrolling', async ({ page }) => {
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflows).toBe(false)
})
