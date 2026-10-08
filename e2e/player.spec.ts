import { expect, test, type Page } from '@playwright/test'

const narration = (page: Page) => page.getByRole('status')
const codeRegion = (page: Page) => page.getByRole('region', { name: 'Code' })
const currentLine = (page: Page) => codeRegion(page).locator('[aria-current="step"]')

test.beforeEach(async ({ page }) => {
  await page.goto('/#/topic/sum-demo')
  // React renders after the load event; key presses before that are lost.
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
})

test('starts on step 1 with the function header highlighted', async ({ page }) => {
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  await expect(narration(page)).toHaveText('Call sum with [2, 4, 6].')
  await expect(currentLine(page)).toContainText('function sum(numbers) {')
})

test('Next and Back change the step, narration, variables and highlighted line together', async ({ page }) => {
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('Step 3 of 9')).toBeVisible()
  await expect(narration(page)).toHaveText('Pick up the next number, 2.')
  await expect(currentLine(page)).toContainText('for (const n of numbers) {')
  await expect(page.getByRole('region', { name: 'Variables' })).toContainText('total')

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByText('Step 2 of 9')).toBeVisible()
  await expect(currentLine(page)).toContainText('let total = 0')
})

test('arrow keys step and R restarts', async ({ page }) => {
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByText('Step 4 of 9')).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByText('Step 3 of 9')).toBeVisible()
  await page.keyboard.press('r')
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
})

test('the TS toggle changes the code but keeps the same line highlighted', async ({ page }) => {
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(codeRegion(page)).not.toContainText('number[]')
  await page.getByRole('button', { name: 'TS' }).click()
  await expect(codeRegion(page)).toContainText('numbers: number[]')
  await expect(currentLine(page)).toContainText('for (const n of numbers) {')
  await page.getByRole('button', { name: 'JS' }).click()
  await expect(codeRegion(page)).not.toContainText('number[]')
  await expect(currentLine(page)).toContainText('for (const n of numbers) {')
})

test('Shiki colors the code in the browser', async ({ page }) => {
  await expect(codeRegion(page).locator('span[style*="color"]').first()).toBeVisible()
})

test('Space plays at max speed, stops on the last step, and Space then starts over', async ({ page }) => {
  await page.getByRole('slider', { name: 'Speed' }).fill('4')
  // Move focus off the slider: shortcuts are ignored while a form control has focus.
  await page.getByRole('heading', { level: 1 }).click()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await expect(page.getByText('Step 9 of 9')).toBeVisible()
  await expect(narration(page)).toHaveText('Every number is counted, so return 12.')
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled()

  await page.keyboard.press('Space')
  await expect(page.getByText('Step 1 of 9')).toBeHidden()
})

test('the slider keeps the arrow keys for itself', async ({ page }) => {
  await page.getByRole('slider', { name: 'Speed' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  await expect(page.getByRole('slider', { name: 'Speed' })).toHaveValue('1.5')
})

test('controls fit on screen without sideways scrolling', async ({ page }) => {
  const viewport = page.viewportSize()!
  for (const name of ['Restart', 'Back', 'Play', 'Next']) {
    const box = await page.getByRole('button', { name }).boundingBox()
    expect(box, `${name} button should be on the page`).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
  }
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflows).toBe(false)
})
