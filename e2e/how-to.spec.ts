import { expect, test, type Page } from '@playwright/test'

const bubble = (page: Page) => page.getByRole('dialog', { name: /^(The picture|The code|Predict mode|The controls|Try your own numbers)$/ })
const helpLink = (page: Page) => page.getByRole('banner').getByRole('link', { name: 'How to use' })

test('the header link opens the page, with focus on its heading', async ({ page }) => {
  await page.goto('/')
  await helpLink(page).click()
  await expect(page).toHaveURL(/#\/how-to$/)
  await expect(page.getByRole('heading', { level: 1, name: 'How to use' })).toBeFocused()
  await expect(page).toHaveTitle('How to use · Stepwise')
})

test('the link is there on every page, and works from the keyboard', async ({ page }) => {
  for (const url of ['/', '/#/topic/sum-demo', '/#/badges']) {
    await page.goto(url)
    await expect(helpLink(page)).toBeVisible()
  }
  await page.goto('/')
  await helpLink(page).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: 'How to use' })).toBeVisible()
})

test('has the six sections, three quick-start steps and the shortcut table', async ({ page }) => {
  await page.goto('/#/how-to')
  const headings = await page.getByRole('heading', { level: 2 }).allTextContents()
  expect(headings).toEqual([
    'Quick start',
    'Controls and keyboard shortcuts',
    'Reading a topic page',
    'Stars, streak and badges',
    'Your data',
    'Replay the tour',
  ])
  await expect(page.getByRole('list', { name: 'Quick start steps' }).getByRole('listitem')).toHaveCount(3)

  const table = page.getByRole('table', { name: 'Controls and keyboard shortcuts' })
  await expect(table.getByRole('row', { name: /Play or pause/ })).toContainText('Space')
  await expect(table.getByRole('row', { name: /Next step/ })).toContainText('→')
  await expect(table.getByRole('row', { name: /Previous step/ })).toContainText('←')
  await expect(table.getByRole('row', { name: /Restart/ })).toContainText('R')
  await expect(table.getByRole('row', { name: /Answer a prediction/ })).toContainText('1 – 4')
  await expect(table.getByRole('row', { name: /Speed/ })).toContainText('slider')
})

test('the documented shortcuts really work on a topic page', async ({ page }) => {
  await page.goto('/#/topic/sum-demo')
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByText('Step 2 of 9')).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('r')
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
})

test('the stars, streak and badge explanations link to the badges page', async ({ page }) => {
  await page.goto('/#/how-to')
  const section = page.getByRole('region', { name: 'Stars, streak and badges' })
  await expect(section).toContainText('3 stars')
  await expect(section).toContainText(/weekly freeze/i)
  await section.getByRole('link', { name: /badges page/i }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Badges' })).toBeVisible()
})

test('Replay the tour opens the first topic with the tour on step 1, even though it was seen', async ({ page }) => {
  await page.goto('/#/how-to')
  await page.getByRole('button', { name: 'Replay the tour' }).click()
  await expect(page).toHaveURL(/#\/topic\/sum-demo$/)
  await expect(bubble(page)).toBeVisible()
  await expect(page.getByText('Step 1 of 5')).toBeVisible()

  await bubble(page).getByRole('button', { name: 'Skip tour' }).click()
  await expect(bubble(page)).toHaveCount(0)
  await page.reload()
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  await expect(bubble(page)).toHaveCount(0) // a replay does not make it start by itself again
})

test('fits the screen without sideways scrolling, header included', async ({ page }) => {
  await page.goto('/#/how-to')
  await expect(page.getByRole('heading', { level: 1, name: 'How to use' })).toBeVisible()
  const viewport = page.viewportSize()!
  const link = (await helpLink(page).boundingBox())!
  expect(link.x).toBeGreaterThanOrEqual(0)
  expect(link.x + link.width).toBeLessThanOrEqual(viewport.width)
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflows).toBe(false)
})
