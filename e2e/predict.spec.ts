import { expect, test, type Page } from '@playwright/test'

const toggle = (page: Page) => page.getByRole('switch', { name: 'Predict mode' })
const stepText = (page: Page) => page.locator('.controls-step')
const questionGroup = (page: Page) => page.getByRole('group', { name: /^What will/ })
const answer = (page: Page, text: string) => questionGroup(page).getByRole('button', { name: text, exact: true })

test.beforeEach(async ({ page }) => {
  await page.goto('/#/topic/sum-demo')
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
})

/** Steps forward until a question appears (at most three presses), then picks an answer. */
async function answerNext(page: Page, text: string) {
  for (let i = 0; i < 3 && !(await questionGroup(page).isVisible()); i++) await page.keyboard.press('ArrowRight')
  await expect(questionGroup(page)).toBeVisible()
  await answer(page, text).click()
}

async function reachFirstQuestion(page: Page) {
  await toggle(page).check()
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight')
  await expect(questionGroup(page)).toBeVisible()
}

test('is off by default, and then nothing ever pauses', async ({ page }) => {
  await expect(toggle(page)).not.toBeChecked()
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight')
  await expect(stepText(page)).toHaveText('Step 9 of 9')
  await expect(questionGroup(page)).toHaveCount(0)
  await expect(page.getByText(/you predicted/i)).toHaveCount(0)
})

test('with it on, the player stops before the step, still showing the one before', async ({ page }) => {
  await reachFirstQuestion(page)
  await expect(page.getByRole('heading', { name: 'What will total be after adding 2?' })).toBeFocused()
  await expect(stepText(page)).toHaveText('Step 3 of 9')
  await expect(page.getByRole('status')).toHaveText('Pick up the next number, 2.')
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Play' })).toBeDisabled()

  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Space')
  await expect(stepText(page)).toHaveText('Step 3 of 9')
  await expect(questionGroup(page)).toBeVisible()
})

test('a wrong answer is explained, names the right one, and the step still appears', async ({ page }) => {
  await reachFirstQuestion(page)
  await answer(page, '0').click()
  await expect(stepText(page)).toHaveText('Step 4 of 9')
  await expect(page.getByText('Not quite. The answer was 2.')).toBeVisible()
  await expect(page.getByText('total was 0 and 2 is added, so it becomes 2.')).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Add 2 to the total, which is now 2.')
  await expect(page.locator('.predict-feedback')).toBeFocused()
})

test('the number keys answer, and a right answer says so', async ({ page }) => {
  await reachFirstQuestion(page)
  await page.keyboard.press('1') // the right answer sits in position 1 for this question
  await expect(page.getByText('Right!')).toBeVisible()
  await expect(stepText(page)).toHaveText('Step 4 of 9')
})

test('autoplay stops at a question and waits, then stays paused after the answer', async ({ page }) => {
  await toggle(page).check()
  await page.getByRole('slider', { name: 'Speed' }).fill('4')
  await page.getByRole('heading', { level: 1 }).click()
  await page.keyboard.press('Space')
  await expect(questionGroup(page)).toBeVisible()
  await page.waitForTimeout(1500)
  await expect(stepText(page)).toHaveText('Step 3 of 9') // it waited
  await answer(page, '2').click()
  await expect(stepText(page)).toHaveText('Step 4 of 9')
  await page.waitForTimeout(1000)
  await expect(stepText(page)).toHaveText('Step 4 of 9') // paused until Play is pressed
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
})

test('a whole run ends with the score, here 2 of 4', async ({ page }) => {
  await toggle(page).check()
  await answerNext(page, '0') // wrong (right is 2)
  await answerNext(page, '6') // right
  await answerNext(page, '12') // right
  await answerNext(page, '3') // wrong (right is 12)
  await expect(stepText(page)).toHaveText('Step 9 of 9')
  await expect(page.getByText('Run complete')).toBeVisible()
  await expect(page.getByText('You predicted 2 of 4.')).toBeVisible()
})

test('a question is asked once per run, and Restart gives a fresh run', async ({ page }) => {
  await reachFirstQuestion(page)
  await answer(page, '2').click()
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowRight')
  await expect(questionGroup(page)).toHaveCount(0) // not asked again
  await expect(page.getByText('Right!')).toBeVisible()

  await page.getByRole('button', { name: 'Restart' }).click()
  await expect(page.getByText('Right!')).toHaveCount(0)
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight')
  await expect(questionGroup(page)).toBeVisible() // asked again
})

test('Back cancels a waiting question', async ({ page }) => {
  await reachFirstQuestion(page)
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(questionGroup(page)).toHaveCount(0)
  await expect(stepText(page)).toHaveText('Step 2 of 9')
})

test('switching predict mode off while a question waits reveals the step', async ({ page }) => {
  await reachFirstQuestion(page)
  await toggle(page).uncheck()
  await expect(questionGroup(page)).toHaveCount(0)
  await expect(stepText(page)).toHaveText('Step 4 of 9')
  await expect(page.getByText(/Right!|Not quite/)).toHaveCount(0)
})

test('the switch is remembered after a reload and on other visits', async ({ page }) => {
  await toggle(page).check()
  await page.reload()
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  await expect(toggle(page)).toBeChecked()
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight')
  await expect(questionGroup(page)).toBeVisible()
})

test('the question fits the screen, has big tap targets and does not scroll sideways', async ({ page }) => {
  await reachFirstQuestion(page)
  const viewport = page.viewportSize()!
  const buttons = await questionGroup(page).getByRole('button').all()
  expect(buttons.length).toBeGreaterThanOrEqual(2)
  for (const button of buttons) {
    const box = (await button.boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  }
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflows).toBe(false)
})

test('predictions alone never complete a topic or award stars', async ({ page }) => {
  await toggle(page).check()
  await answerNext(page, '2')
  await page.goto('/#/')
  await expect(page.getByRole('heading', { level: 1, name: 'Your path' })).toBeVisible()
  await expect(page.getByRole('listitem', { name: 'Warm-up: Add up the numbers' })).not.toContainText('Completed')
})
