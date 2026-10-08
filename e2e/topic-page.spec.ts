import { expect, test, type Page } from '@playwright/test'

const ANSWERS = {
  right: [
    ['What is total after the loop finishes for [2, 4, 6]?', '12'],
    ['How many times does the loop body run for [2, 4, 6]?', '3 times'],
    ['What does sum([]) return?', 'It returns 0'],
  ],
  wrong: [
    ['What is total after the loop finishes for [2, 4, 6]?', '10'],
    ['How many times does the loop body run for [2, 4, 6]?', '2 times'],
    ['What does sum([]) return?', 'It returns 1'],
  ],
}

async function answer(page: Page, which: keyof typeof ANSWERS) {
  for (const [question, option] of ANSWERS[which]) {
    await page.getByRole('group', { name: question }).getByRole('radio', { name: option }).check()
  }
}

const warmUpOnMap = (page: Page) => page.getByRole('listitem', { name: 'Warm-up: Add up the numbers' })

test('opens the warm-up from the map and puts focus on its heading', async ({ page }) => {
  await page.goto('/')
  await warmUpOnMap(page).getByRole('link').click()
  await expect(page).toHaveURL(/#\/topic\/sum-demo$/)
  const heading = page.getByRole('heading', { level: 1, name: 'Warm-up: Add up the numbers' })
  await expect(heading).toBeFocused()
  await expect(page).toHaveTitle('Warm-up: Add up the numbers · Stepwise')
})

test('keyboard only: Enter on the stage link opens the topic', async ({ page }) => {
  await page.goto('/')
  await warmUpOnMap(page).getByRole('link').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: 'Warm-up: Add up the numbers' })).toBeFocused()
})

test('shows the sections: summary, analogy, player, Big O, quiz and source', async ({ page }) => {
  await page.goto('/#/topic/sum-demo')
  await expect(page.getByText('What this does')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Analogy' })).toBeVisible()
  await expect(page.getByText('Where the analogy breaks:')).toBeVisible()
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Big O' })).toBeVisible()
  await expect(page.getByText('Time O(n) because')).toBeVisible()
  await expect(page.getByText('Space O(1) because')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Check yourself' })).toBeVisible()
  await expect(page.getByRole('link', { name: /MDN: for\.\.\.of/ })).toHaveAttribute('target', '_blank')
  // The warm-up has no verified video, so the block is hidden.
  await expect(page.getByText('Watch first')).toHaveCount(0)
})

test('the step player works inside the topic page', async ({ page }) => {
  await page.goto('/#/topic/sum-demo')
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('Step 2 of 9')).toBeVisible()
})

test('quiz: gated check, score, stars, and the map shows them (best score is kept on retry)', async ({ page }) => {
  await page.goto('/#/topic/sum-demo')
  await expect(page.getByRole('button', { name: 'Check answers' })).toBeDisabled()

  await answer(page, 'right')
  await page.getByRole('button', { name: 'Check answers' }).click()
  await expect(page.getByText('You got 3 of 3.')).toBeVisible()
  await expect(page.getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
  await expect(page.getByText('Correct.')).toHaveCount(3)

  await page.getByRole('link', { name: /back to the map/i }).click()
  await expect(warmUpOnMap(page)).toContainText('Completed')
  await expect(warmUpOnMap(page).getByRole('img', { name: '3 of 3 stars' })).toBeVisible()

  // Retry with all wrong answers: the best score (3 stars) stays.
  await warmUpOnMap(page).getByRole('link').click()
  await answer(page, 'wrong')
  await page.getByRole('button', { name: 'Check answers' }).click()
  await expect(page.getByText('You got 0 of 3.')).toBeVisible()
  await expect(page.getByText(/Not quite/)).toHaveCount(3)
  await page.getByRole('link', { name: /back to the map/i }).click()
  await expect(warmUpOnMap(page).getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
})

test('Try again clears the quiz', async ({ page }) => {
  await page.goto('/#/topic/sum-demo')
  await answer(page, 'wrong')
  await page.getByRole('button', { name: 'Check answers' }).click()
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByText(/You got/)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Check answers' })).toBeDisabled()
})

test('the browser Back button and a refresh both work', async ({ page }) => {
  await page.goto('/')
  await warmUpOnMap(page).getByRole('link').click()
  await expect(page.getByRole('heading', { level: 1, name: 'Warm-up: Add up the numbers' })).toBeVisible()

  await page.goBack()
  await expect(page.getByRole('heading', { level: 1, name: 'Your path' })).toBeVisible()
  await page.goForward()
  await expect(page.getByRole('heading', { level: 1, name: 'Warm-up: Add up the numbers' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Warm-up: Add up the numbers' })).toBeVisible()
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
})

test('unknown and not-yet-built URLs show a friendly page with a way back', async ({ page }) => {
  await page.goto('/#/nope')
  await expect(page.getByRole('heading', { level: 1, name: 'Nothing here yet' })).toBeVisible()
  await expect(page.getByText(/couldn.t find that page/i)).toBeVisible()

  await page.goto('/#/topic/binary-search')
  await expect(page.getByText(/still being built/i)).toBeVisible()
  await page.getByRole('link', { name: /back to the map/i }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Your path' })).toBeVisible()
})

test('the topic page has no sideways scrolling', async ({ page }) => {
  await page.goto('/#/topic/sum-demo')
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflows).toBe(false)
})
