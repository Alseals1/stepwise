import { expect, test } from '@playwright/test'

test('home page shows the app name and tagline', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Stepwise', exact: true })).toBeVisible()
  await expect(page.getByText(/see every step of an algorithm/i)).toBeVisible()
})

test('home page does not scroll sideways', async ({ page }) => {
  await page.goto('/')
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflows).toBe(false)
})
