import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/#/topic/sum-demo')
  // React renders after the load event; key presses before that are lost.
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
})

test('uses a dark page background', async ({ page }) => {
  const [r, g, b] = await page.evaluate(() =>
    getComputedStyle(document.body)
      .backgroundColor.match(/\d+/g)!
      .slice(0, 3)
      .map(Number),
  )
  // Rough relative luminance; a dark theme is well under 0.1.
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  expect(luminance).toBeLessThan(0.1)
})

test('serves its fonts itself, with no requests to other sites', async ({ page }) => {
  const external: string[] = []
  page.on('request', (request) => {
    const { hostname, protocol } = new URL(request.url())
    if (protocol.startsWith('http') && hostname !== 'localhost') external.push(request.url())
  })
  await page.reload()
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready
    return {
      text: document.fonts.check('700 16px "Outfit Variable"'),
      code: document.fonts.check('16px "JetBrains Mono Variable"'),
    }
  })
  expect(loaded).toEqual({ text: true, code: true })
  expect(external).toEqual([])
})

test('shows a visible outline when tabbing to a control', async ({ page }) => {
  await page.keyboard.press('Tab')
  const outline = await page.evaluate(() => {
    const style = getComputedStyle(document.activeElement!)
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) }
  })
  expect(outline.style).not.toBe('none')
  expect(outline.width).toBeGreaterThanOrEqual(3)
})

test('stops animating when the user prefers reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  const current = page.locator('[data-mark="current"]')
  await expect(current).toBeVisible()
  await expect(current).toHaveCSS('animation-name', 'tile-pop')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(current).toHaveCSS('animation-name', 'none')
})

test('Run complete appears on the last step and goes away on Restart', async ({ page }) => {
  await expect(page.getByText('Run complete')).toBeHidden()
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight')
  await expect(page.getByText('Step 9 of 9')).toBeVisible()
  await expect(page.getByText('Run complete')).toBeVisible()
  await expect(page.getByRole('progressbar', { name: 'Step progress' })).toHaveAttribute('aria-valuenow', '9')

  await page.getByRole('button', { name: 'Restart' }).click()
  await expect(page.getByText('Run complete')).toBeHidden()
  await expect(page.getByRole('progressbar', { name: 'Step progress' })).toHaveAttribute('aria-valuenow', '1')
})
