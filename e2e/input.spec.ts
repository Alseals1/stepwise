import { expect, test, type Page } from '@playwright/test'
import { hud } from './helpers'

const field = (page: Page) => page.getByRole('textbox', { name: 'Numbers' })
const stepText = (page: Page) => page.locator('.controls-step')
const boxes = (page: Page) => page.getByRole('list', { name: 'Array' }).locator('.box-value')
const apply = (page: Page) => page.getByRole('button', { name: 'Apply' })

async function enter(page: Page, text: string) {
  await field(page).fill(text)
  await apply(page).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/#/topic/sum-demo')
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
})

test('shows the card with the example and the rules', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 2, name: 'Try your own numbers' })).toBeVisible()
  await expect(field(page)).toHaveValue('2, 4, 6')
  await expect(page.getByText('Up to 8 whole numbers from -99 to 99, separated by commas or spaces.')).toBeVisible()
  for (const name of ['Apply', 'Random', 'Reset']) await expect(page.getByRole('button', { name })).toBeVisible()
})

test('runs the learner’s own numbers: new steps, boxes, narration and result', async ({ page }) => {
  await enter(page, '5, 10')
  await expect(stepText(page)).toHaveText('Step 1 of 7')
  await expect(boxes(page)).toHaveText(['5', '10'])
  await expect(page.getByRole('status')).toHaveText('Call sum with [5, 10].')

  await page.getByRole('heading', { level: 1 }).click() // out of the field, so the shortcuts work
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight')
  await expect(stepText(page)).toHaveText('Step 7 of 7')
  await expect(page.getByRole('status')).toHaveText('Every number is counted, so return 15.')
})

test('Enter applies, from the keyboard alone', async ({ page }) => {
  await field(page).fill('3 1')
  await field(page).press('Enter') // no mouse: Enter in the field is what applies it
  await expect(stepText(page)).toHaveText('Step 1 of 7')
  await expect(boxes(page)).toHaveText(['3', '1'])
})

test('applying in the middle of a run starts over from step 1 and stops playback', async ({ page }) => {
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await enter(page, '8')
  await expect(stepText(page)).toHaveText('Step 1 of 5')
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  await page.waitForTimeout(1500)
  await expect(stepText(page)).toHaveText('Step 1 of 5') // nothing kept playing
})

test('an empty field is an empty list', async ({ page }) => {
  await enter(page, '')
  await expect(stepText(page)).toHaveText('Step 1 of 3')
  await expect(page.getByText('Empty array')).toBeVisible()
})

test.describe('bad input says what to fix and changes nothing', () => {
  const cases: [string, RegExp][] = [
    ['1, two, 3', /"two" isn.t a number\./],
    ['1, 2.5', /"2\.5" isn.t a whole number\./],
    ['+5', /Leave out the plus sign in "\+5"\./],
    ['1 2 3 4 5 6 7 8 9', /Use at most 8 numbers \(you entered 9\)\./],
    ['5, 150', /Numbers must be between -99 and 99 \(found 150\)\./],
  ]
  for (const [text, message] of cases) {
    test(`"${text}"`, async ({ page }) => {
      await page.getByRole('button', { name: 'Next' }).click()
      await page.getByRole('button', { name: 'Next' }).click()
      await enter(page, text)
      await expect(page.getByText(message)).toBeVisible()
      await expect(field(page)).toHaveAttribute('aria-invalid', 'true')
      await expect(field(page)).toHaveValue(text) // left for them to fix
      await expect(stepText(page)).toHaveText('Step 3 of 9') // the run carries on untouched
      await expect(boxes(page)).toHaveText(['2', '4', '6'])
    })
  }

  test('the message goes away when they start fixing it', async ({ page }) => {
    await enter(page, '500')
    await expect(page.getByText(/Numbers must be between/)).toBeVisible()
    await field(page).focus()
    await page.keyboard.type('1') // any edit starts the fix
    await expect(page.getByText(/Numbers must be between/)).toHaveCount(0)
    await expect(field(page)).not.toHaveAttribute('aria-invalid', 'true')
  })
})

test('Random fills in an example and runs it; Reset brings back the original', async ({ page }) => {
  await page.getByRole('button', { name: 'Random' }).click()
  const text = await field(page).inputValue()
  expect(text).toMatch(/^-?\d+(, -?\d+){2,5}$/)
  const count = text.split(', ').length
  await expect(stepText(page)).toHaveText(`Step 1 of ${2 * count + 3}`)
  await expect(boxes(page)).toHaveCount(count)

  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(field(page)).toHaveValue('2, 4, 6')
  await expect(stepText(page)).toHaveText('Step 1 of 9')
})

test('the numbers are not remembered: a reload shows the example again', async ({ page }) => {
  await enter(page, '9, 9, 9')
  await expect(stepText(page)).toHaveText('Step 1 of 9') // three numbers, as many steps as the example
  await expect(boxes(page)).toHaveText(['9', '9', '9'])
  await page.reload()
  await expect(field(page)).toHaveValue('2, 4, 6')
  await expect(boxes(page)).toHaveText(['2', '4', '6'])
})

test('keeps the language and Predict mode when new numbers are applied', async ({ page }) => {
  await page.getByRole('button', { name: 'TS' }).click()
  await page.getByRole('switch', { name: 'Predict mode' }).check()
  await enter(page, '1, 2')
  await expect(page.getByRole('button', { name: 'TS' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('switch', { name: 'Predict mode' })).toBeChecked()
})

test('with Predict mode on, the questions are about the new numbers, and typing digits is not an answer', async ({
  page,
}) => {
  await page.getByRole('switch', { name: 'Predict mode' }).check()
  await enter(page, '8, 3')
  await page.getByRole('heading', { level: 1 }).click()
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('heading', { name: 'What will total be after adding 8?' })).toBeVisible()

  // Typing in the field must not pick an answer.
  await field(page).focus()
  await page.keyboard.type('12')
  await expect(page.getByRole('heading', { name: 'What will total be after adding 8?' })).toBeVisible()
  await expect(stepText(page)).toHaveText('Step 3 of 7')
})

test('a finished run on the learner’s own numbers still counts: First Run and a streak', async ({ page }) => {
  await enter(page, '4')
  await page.getByRole('heading', { level: 1 }).click()
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight')
  await expect(stepText(page)).toHaveText('Step 5 of 5')
  await expect(page.getByText('Badge unlocked: First Run')).toBeVisible()
  await expect(hud(page).getByText('1-day streak')).toBeVisible()
})

test('the card has big enough tap targets and fits the screen without sideways scrolling', async ({ page }) => {
  await enter(page, '500') // so the error message is on screen too
  const viewport = page.viewportSize()!
  for (const locator of [field(page), apply(page), page.getByRole('button', { name: 'Random' }), page.getByRole('button', { name: 'Reset' })]) {
    const box = (await locator.boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  }
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflows).toBe(false)
})

test('the How-to page explains it', async ({ page }) => {
  await page.goto('/#/how-to')
  const reading = page.getByRole('region', { name: 'Reading a topic page' })
  await expect(reading.getByText('Try your own numbers', { exact: true })).toBeVisible()
  await expect(reading).toContainText('up to 8 whole numbers from -99 to 99')
})
