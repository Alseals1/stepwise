import { expect, test, type Page } from '@playwright/test'
import { hud } from './helpers'

const TOPIC = '/#/topic/has-duplicate'
const stepText = (page: Page) => page.locator('.controls-step')
const narration = (page: Page) => page.getByRole('status')
const field = (page: Page) => page.getByRole('textbox', { name: 'List' })
const variable = (page: Page, name: string) =>
  page.getByRole('region', { name: 'Variables' }).locator('.variable', { hasText: name }).locator('dd')
const highlighted = (page: Page) => page.locator('.code-panel [aria-current="step"]')
const rowValues = (page: Page, row: 'items' | 'seen') => page.getByRole('list', { name: row }).locator('.box-value')

const state = (completed: Record<string, { stars: number }>, unlockAll = false) => ({
  version: 1,
  completed,
  unlockAll,
  runs: {},
  settings: { language: 'js', speed: 1, predictMode: false },
  streak: { current: 0, longest: 0, lastStudyDay: null, freezeUsedWeek: null },
  badges: {},
  help: { tourSeen: true },
})
const stored = (s: object) => ({
  cookies: [],
  origins: [{ origin: 'http://localhost:5173', localStorage: [{ name: 'stepwise:v1', value: JSON.stringify(s) }] }],
})
async function press(page: Page, times: number) {
  for (let i = 0; i < times; i++) await page.keyboard.press('ArrowRight')
}

test.describe('unlocking', () => {
  test.use({ storageState: stored(state({ 'sum-demo': { stars: 3 }, 'array-basics': { stars: 3 } })) })

  test('is locked until the hidden loop is done, and says so', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('listitem', { name: 'Duplicate check: loops vs a Set' })).toContainText(
      'Locked. Finish The hidden loop to unlock.',
    )
    await page.goto(TOPIC)
    await expect(page.getByRole('heading', { level: 1, name: 'Locked' })).toBeVisible()
    await expect(page.getByText(/Finish The hidden loop to unlock this topic/)).toBeVisible()
  })
})

test.describe('unlocked', () => {
  test.use({
    storageState: stored(
      state({
        'sum-demo': { stars: 3 },
        'array-basics': { stars: 3 },
        'map-filter-reduce': { stars: 3 },
        'hidden-loops': { stars: 3 },
      }),
    ),
  })

  test('opens from the map as next up', async ({ page }) => {
    await page.goto('/')
    const stage = page.getByRole('listitem', { name: 'Duplicate check: loops vs a Set' })
    await expect(stage.getByText('Next up')).toBeVisible()
    await stage.getByRole('link').click()
    await expect(page.getByRole('heading', { level: 1, name: 'Duplicate check: loops vs a Set' })).toBeVisible()
    await expect(stepText(page)).toHaveText('Step 1 of 31')
  })
})

test.describe('the walkthrough', () => {
  test.use({ storageState: stored(state({}, true)) })

  test.beforeEach(async ({ page }) => {
    await page.goto(TOPIC)
    await expect(stepText(page)).toHaveText('Step 1 of 31')
    await page.getByRole('heading', { level: 1 }).click() // so the shortcuts work
  })

  test('has the topic page sections, and the MDN Set page as its source', async ({ page }) => {
    await expect(page.getByText('A bouncer who stamps each guest')).toBeVisible()
    await expect(page.getByText('Where the analogy breaks:')).toBeVisible()
    await expect(page.getByText('Time O(n²) vs O(n) because')).toBeVisible()
    await expect(page.getByText('Space O(1) vs O(n) because')).toBeVisible()
    await expect(page.getByRole('link', { name: 'MDN: Set' })).toHaveAttribute('target', '_blank')
    await expect(page.getByText('Watch first')).toHaveCount(0)
  })

  test('part 1: compares every pair, marking the outer and the inner item differently', async ({ page }) => {
    await press(page, 1)
    await expect(narration(page)).toHaveText('Compare items[0] = 4 with items[1] = 7: not equal.')
    await expect(highlighted(page)).toContainText('items[i] === items[j]')
    await expect(page.getByRole('list', { name: 'items' }).locator('li[data-mark="current"]')).toHaveCount(1)
    await expect(page.getByRole('list', { name: 'items' }).locator('li[data-mark="compare"]')).toHaveCount(1)
    await expect(variable(page, 'comparisons')).toHaveText('1')
    await press(page, 14) // all 15 pairs
    await expect(variable(page, 'comparisons')).toHaveText('15')
    await press(page, 1)
    await expect(stepText(page)).toHaveText('Step 17 of 31')
    await expect(narration(page)).toHaveText('No pair was equal, so return false.')
  })

  test('part 2: the highlight moves to the Set function, and the Set fills as items are added', async ({ page }) => {
    await press(page, 17) // the Set function begins
    await expect(stepText(page)).toHaveText('Step 18 of 31')
    await expect(highlighted(page)).toContainText('function hasDuplicateFast(items)')
    await expect(narration(page)).toHaveText('Now the same list with a Set: call hasDuplicateFast with [4, 7, 2, 9, 5, 1].')
    await expect(page.getByRole('list', { name: 'seen' })).toHaveCount(0) // empty at first
    await press(page, 2) // lookup, then add
    await expect(highlighted(page)).toContainText('seen.add(item)')
    await expect(rowValues(page, 'seen')).toHaveText(['4'])
    await expect(variable(page, 'lookups')).toHaveText('1')
  })

  test('ends by comparing the two costs: 6 lookups against 15 comparisons', async ({ page }) => {
    await press(page, 30)
    await expect(stepText(page)).toHaveText('Step 31 of 31')
    await expect(narration(page)).toHaveText(
      'Every item was new, so return false. The Set made 6 lookups; the nested loops made 15 comparisons.',
    )
    await expect(variable(page, 'comparisons')).toHaveText('15')
    await expect(variable(page, 'lookups')).toHaveText('6')
    await expect(rowValues(page, 'seen')).toHaveText(['4', '7', '2', '9', '5', '1'])
    await expect(page.getByText('Run complete')).toBeVisible()
  })

  test('a list with a repeat: each part stops at the first duplicate', async ({ page }) => {
    await field(page).fill('3, 1, 3')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 11')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 3)
    await expect(narration(page)).toHaveText('Found an equal pair, so return true and the function stops right away.')
    await press(page, 7)
    await expect(stepText(page)).toHaveText('Step 11 of 11')
    await expect(narration(page)).toHaveText(
      'Found a repeat, so return true. The Set made 3 lookups; the nested loops made 2 comparisons.',
    )
  })

  test('with predict mode on it asks about both costs, and both are right for the default list', async ({ page }) => {
    await page.getByRole('switch', { name: 'Predict mode' }).check()
    await page.getByRole('heading', { level: 1 }).click()
    const answerNext = async (question: string, answer: string) => {
      for (let i = 0; i < 40; i++) {
        if (await page.getByRole('heading', { name: question }).isVisible()) break
        await page.keyboard.press('ArrowRight')
      }
      await expect(page.getByRole('heading', { name: question })).toBeVisible()
      await page.getByRole('group', { name: question }).getByRole('button', { name: answer, exact: true }).click()
      await expect(page.getByText('Right!')).toBeVisible()
    }
    await answerNext('How many comparisons will the nested loops make?', '15')
    await expect(page.getByText('Each item is compared with every item after it: 6 items make 15 pairs.')).toBeVisible()
    await answerNext('How many lookups will the Set make?', '6')
    await expect(page.getByText('The Set makes one lookup per item: 6 lookups.')).toBeVisible()
    await press(page, 12) // the rest of the Set's six lookups and adds, then the return
    await expect(stepText(page)).toHaveText('Step 31 of 31')
    await expect(page.getByText('You predicted 2 of 2.')).toBeVisible()
  })

  test('an empty list and a seventh number', async ({ page }) => {
    await field(page).fill('')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 4')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 1)
    await expect(narration(page)).toHaveText('There are no pairs to compare, so return false.')

    await field(page).fill('1 2 3 4 5 6 7')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(page.getByText('Use at most 6 numbers (you entered 7).')).toBeVisible()
    await expect(stepText(page)).toHaveText('Step 2 of 4') // the run in progress is untouched
    await expect(narration(page)).toHaveText('There are no pairs to compare, so return false.')
  })

  test('the quiz completes the topic and earns stars', async ({ page }) => {
    const answers: [string, string][] = [
      ['How many comparisons do nested loops make for 5 different items?', '10'],
      ['What does the Set version pay for being faster?', 'More memory'],
      ['For 1,000 different items, about how many lookups does the Set make?', '1,000'],
    ]
    for (const [question, option] of answers) {
      await page.getByRole('group', { name: question }).getByRole('radio', { name: option, exact: true }).check()
    }
    await page.getByRole('button', { name: 'Check answers' }).click()
    await expect(page.getByText('You got 3 of 3.')).toBeVisible()
    await page.getByRole('link', { name: /back to the map/i }).click()
    const stage = page.getByRole('listitem', { name: 'Duplicate check: loops vs a Set' })
    await expect(stage).toContainText('Completed')
    await expect(stage.getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
  })

  test('two rows of six boxes fit a phone with no sideways scrolling', async ({ page }) => {
    await press(page, 30)
    const viewport = page.viewportSize()!
    for (const box of await page.locator('.rows-view .array-boxes li').all()) {
      const b = (await box.boundingBox())!
      expect(b.x).toBeGreaterThanOrEqual(0)
      expect(b.x + b.width).toBeLessThanOrEqual(viewport.width)
    }
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(overflows).toBe(false)
  })
})

test.describe('common bugs', () => {
  test.use({ storageState: stored(state({}, true)) })

  const panel = (page: Page) => page.getByRole('region', { name: 'Common bugs' })
  const bugButton = (page: Page, name: string) => panel(page).getByRole('button', { name, exact: true })
  const back = (page: Page) => panel(page).getByRole('button', { name: 'Back to the correct version' })
  const next = async (page: Page, times: number) => {
    for (let i = 0; i < times; i++) await page.getByRole('button', { name: 'Next' }).click()
  }
  const savedProgress = (page: Page) =>
    page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('stepwise:v1') ?? '{}')
      return { runs: saved.runs, completed: saved.completed }
    })

  test.beforeEach(async ({ page }) => {
    await page.goto(TOPIC)
    await expect(stepText(page)).toHaveText('Step 1 of 31')
  })

  test('the panel sits under the player, with three buttons and none pressed', async ({ page }) => {
    await expect(panel(page).getByRole('heading', { level: 2, name: 'Common bugs' })).toBeVisible()
    const player = (await page.locator('.player').boundingBox())!
    const box = (await panel(page).boundingBox())!
    expect(box.y).toBeGreaterThanOrEqual(player.y + player.height)
    for (const name of ['.has on the array', 'i instead of items[i]', 'Never calling add']) {
      await expect(bugButton(page, name)).toHaveAttribute('aria-pressed', 'false')
      expect((await bugButton(page, name).boundingBox())!.height).toBeGreaterThanOrEqual(44)
    }
    await expect(back(page)).toHaveCount(0)
  })

  test('.has on the array: the broken line, then a TypeError that stops the run', async ({ page }) => {
    await bugButton(page, '.has on the array').click()
    await expect(bugButton(page, '.has on the array')).toHaveAttribute('aria-pressed', 'true')
    await expect(stepText(page)).toHaveText('Step 1 of 4')
    await expect(narration(page)).toHaveText('A list with a repeat shows the bug: [3, 1, 3].')
    await expect(page.locator('.code-body')).toContainText('if (items.has(item)) return true')
    await expect(page.locator('.code-body')).not.toContainText('hasDuplicateSlow')
    await next(page, 3)
    await expect(highlighted(page)).toContainText('if (items.has(item)) return true')
    await expect(stepText(page)).toHaveText('Step 4 of 4')
    await expect(narration(page)).toContainText('TypeError: items.has is not a function')
    await expect(variable(page, 'error')).toHaveText('"TypeError: items.has is not a function"')
    await expect(panel(page)).toContainText('An array has no has method')
    await expect(page.getByText('Run complete')).toBeVisible()
  })

  test('i instead of items[i]: compares positions and answers false for a list with a repeat', async ({ page }) => {
    await bugButton(page, 'i instead of items[i]').click()
    await expect(stepText(page)).toHaveText('Step 1 of 5')
    await next(page, 1)
    await expect(highlighted(page)).toContainText('if (i === j) return true')
    await expect(narration(page)).toHaveText('Compare i = 0 with j = 1: they are different positions, so 0 === 1 is false.')
    await next(page, 3)
    await expect(stepText(page)).toHaveText('Step 5 of 5')
    await expect(narration(page)).toHaveText(
      'No pair matched, so return false. But 3 appears twice, so the right answer is true.',
    )
    await expect(variable(page, 'returned')).toHaveText('false')
    await expect(panel(page)).toContainText('j always starts at i + 1')
  })

  test('never calling add: the Set stays empty and every lookup misses', async ({ page }) => {
    await bugButton(page, 'Never calling add').click()
    await expect(stepText(page)).toHaveText('Step 1 of 9')
    await expect(page.locator('.code-body')).toContainText('seen.add(item) is missing here')
    await next(page, 3)
    await expect(highlighted(page)).toContainText('seen.add(item) is missing here')
    await expect(narration(page)).toHaveText('Nothing adds 3 to the Set, so seen is still empty.')
    await next(page, 5)
    await expect(stepText(page)).toHaveText('Step 9 of 9')
    await expect(narration(page)).toContainText('Every lookup missed because the Set stayed empty, so return false.')
    await expect(variable(page, 'lookups')).toHaveText('3')
    await expect(rowValues(page, 'seen')).toHaveCount(0)
    await expect(panel(page)).toContainText('Without seen.add(item) the Set never holds anything')
  })

  test('a bug can be chosen from the keyboard, and uses the learner’s list when it has a repeat', async ({ page }) => {
    await field(page).fill('5, 2, 9, 2')
    await page.getByRole('button', { name: 'Apply' }).click()
    await bugButton(page, 'i instead of items[i]').focus()
    await page.keyboard.press('Enter')
    await expect(bugButton(page, 'i instead of items[i]')).toHaveAttribute('aria-pressed', 'true')
    await expect(narration(page)).toHaveText('Call hasDuplicate with [5, 2, 9, 2], a list with a repeat.')
    await expect(rowValues(page, 'items')).toHaveText(['5', '2', '9', '2'])
    await expect(stepText(page)).toHaveText('Step 1 of 8')
  })

  test('switching bugs restarts the run, and going back restores the correct one', async ({ page }) => {
    await bugButton(page, 'Never calling add').click()
    await next(page, 4)
    await bugButton(page, 'i instead of items[i]').click()
    await expect(stepText(page)).toHaveText('Step 1 of 5')
    await expect(bugButton(page, 'Never calling add')).toHaveAttribute('aria-pressed', 'false')
    await back(page).click()
    await expect(stepText(page)).toHaveText('Step 1 of 31')
    await expect(bugButton(page, 'i instead of items[i]')).toHaveAttribute('aria-pressed', 'false')
    await expect(back(page)).toHaveCount(0)
    await expect(highlighted(page)).toContainText('function hasDuplicateSlow(items)')
    await expect(narration(page)).toHaveText('Call hasDuplicateSlow with [4, 7, 2, 9, 5, 1].')
  })

  test('a bug run played to the end does not complete the topic or light the streak', async ({ page }) => {
    await expect(hud(page).getByText('Start a streak')).toBeVisible()
    for (const [name, steps] of [
      ['.has on the array', 4],
      ['i instead of items[i]', 5],
      ['Never calling add', 9],
    ] as const) {
      await bugButton(page, name).click()
      await next(page, steps - 1)
      await expect(page.getByText('Run complete')).toBeVisible()
    }
    await expect(hud(page).getByText('Start a streak')).toBeVisible()
    expect(await savedProgress(page)).toEqual({ runs: {}, completed: {} })

    // The same page does count the real run.
    await back(page).click()
    await next(page, 30)
    await expect(page.getByText('Run complete')).toBeVisible()
    await expect(hud(page).getByText('1-day streak')).toBeVisible()
    expect((await savedProgress(page)).runs).toEqual({ 'has-duplicate': true })
  })

  test('has no predict questions in a bug run', async ({ page }) => {
    await page.getByRole('switch', { name: 'Predict mode' }).check()
    await bugButton(page, 'i instead of items[i]').click()
    await expect(page.getByRole('switch', { name: 'Predict mode' })).toHaveCount(0)
    await next(page, 4)
    await expect(stepText(page)).toHaveText('Step 5 of 5')
  })

  test('has one live narration, and the reason does not take its role', async ({ page }) => {
    await bugButton(page, 'Never calling add').click()
    await expect(page.getByRole('status')).toHaveCount(1)
    await expect(panel(page).locator('[aria-live="polite"]')).toContainText('Why it goes wrong')
  })

  test('fits a phone with a bug on: no sideways scrolling, buttons inside the screen', async ({ page }) => {
    const viewport = page.viewportSize()!
    for (const name of ['.has on the array', 'i instead of items[i]', 'Never calling add']) {
      await bugButton(page, name).click()
      for (const button of await panel(page).getByRole('button').all()) {
        const b = (await button.boundingBox())!
        expect(b.x).toBeGreaterThanOrEqual(0)
        expect(b.x + b.width).toBeLessThanOrEqual(viewport.width)
        expect(b.height).toBeGreaterThanOrEqual(44)
      }
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      )
      expect(overflows).toBe(false)
    }
  })
})
