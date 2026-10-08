import { expect, test, type Page } from '@playwright/test'

const TOPIC = '/#/topic/map-filter-reduce'
const TITLE = 'map, filter and reduce'
const stepText = (page: Page) => page.locator('.controls-step')
const narration = (page: Page) => page.getByRole('status')
const field = (page: Page) => page.getByRole('textbox', { name: 'List' })
const variable = (page: Page, name: string) =>
  page.getByRole('region', { name: 'Variables' }).locator('.variable', { hasText: name }).locator('dd')
const highlighted = (page: Page) => page.locator('.code-panel [aria-current="step"]')
const rowValues = (page: Page, row: 'nums' | 'doubled' | 'big' | 'total' | 'first') =>
  page.getByRole('list', { name: row }).locator('.box-value')

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
  test.use({ storageState: stored(state({ 'sum-demo': { stars: 3 } })) })

  test('is locked until Array basics is done, and says so', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('listitem', { name: TITLE })).toContainText('Locked. Finish Array basics to unlock.')
    await page.goto(TOPIC)
    await expect(page.getByRole('heading', { level: 1, name: 'Locked' })).toBeVisible()
    await expect(page.getByText(/Finish Array basics to unlock this topic/)).toBeVisible()
  })
})

test.describe('unlocked', () => {
  test.use({ storageState: stored(state({ 'sum-demo': { stars: 3 }, 'array-basics': { stars: 3 } })) })

  test('opens from the map as next up', async ({ page }) => {
    await page.goto('/')
    const stage = page.getByRole('listitem', { name: TITLE })
    await expect(stage.getByText('Next up')).toBeVisible()
    await stage.getByRole('link').click()
    await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible()
    await expect(stepText(page)).toHaveText('Step 1 of 24')
  })

  test('finishing it is what opens The hidden loop', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('listitem', { name: 'The hidden loop' })).toContainText(
      'Locked. Finish map, filter and reduce to unlock.',
    )
  })
})

test.describe('the walkthrough', () => {
  test.use({ storageState: stored(state({}, true)) })

  test.beforeEach(async ({ page }) => {
    await page.goto(TOPIC)
    await expect(stepText(page)).toHaveText('Step 1 of 24')
    await page.getByRole('heading', { level: 1 }).click() // so the shortcuts work
  })

  test('has the topic page sections, and javascript.info as its source', async ({ page }) => {
    await expect(page.getByText('A factory conveyor belt.')).toBeVisible()
    await expect(page.getByText('Where the analogy breaks:')).toBeVisible()
    await expect(page.getByText('Time O(n) because')).toBeVisible()
    await expect(page.getByText('Space O(n) because')).toBeVisible()
    await expect(page.getByRole('link', { name: 'javascript.info: Array methods' })).toHaveAttribute('target', '_blank')
    await expect(page.getByText('Watch first')).toHaveCount(0)
  })

  test('starts with the list on show and the four methods in the code', async ({ page }) => {
    await expect(rowValues(page, 'nums')).toHaveText(['3', '4', '8', '5', '12'])
    await expect(narration(page)).toHaveText(
      'Call demo with [3, 4, 8, 5, 12]. We will try four methods on this one list.',
    )
    const code = page.locator('.code-panel')
    for (const method of ['nums.map', 'nums.filter', 'nums.reduce', 'nums.find']) await expect(code).toContainText(method)
  })

  test('map: the callback runs once per item and builds a new list, the original stays put', async ({ page }) => {
    await press(page, 1)
    await expect(highlighted(page)).toContainText('nums.map')
    await expect(narration(page)).toHaveText('The callback gets n = 3 and returns 3 * 2 = 6, which goes into the new list.')
    await expect(rowValues(page, 'doubled')).toHaveText(['6'])
    await expect(page.getByRole('list', { name: 'nums' }).locator('li[data-mark="current"]')).toHaveCount(1)
    await press(page, 4)
    await expect(rowValues(page, 'doubled')).toHaveText(['6', '8', '16', '10', '24'])
    await press(page, 1)
    await expect(stepText(page)).toHaveText('Step 7 of 24')
    await expect(narration(page)).toHaveText(
      'map is done: [3, 4, 8, 5, 12] became [6, 8, 16, 10, 24]. nums itself is unchanged.',
    )
    await expect(rowValues(page, 'nums')).toHaveText(['3', '4', '8', '5', '12'])
    await expect(variable(page, 'doubled')).toContainText('6, 8, 16, 10, 24')
  })

  test('filter: keeps the big items, and the dropped ones fade', async ({ page }) => {
    await press(page, 7)
    await expect(highlighted(page)).toContainText('nums.filter')
    await expect(narration(page)).toHaveText('The callback gets n = 3: 3 > 5 is false, so 3 is left out.')
    await press(page, 5)
    await expect(stepText(page)).toHaveText('Step 13 of 24')
    await expect(narration(page)).toHaveText('filter is done: it kept 2 items, [8, 12].')
    await expect(rowValues(page, 'big')).toHaveText(['8', '12'])
    await expect(page.getByRole('list', { name: 'nums' }).locator('li[data-mark="dim"]')).toHaveCount(3)
  })

  test('reduce: carries a running total, starting from 0', async ({ page }) => {
    await press(page, 13)
    await expect(highlighted(page)).toContainText('nums.reduce')
    await expect(narration(page)).toHaveText('reduce starts with 0 as the total, then the callback runs once per item.')
    await expect(rowValues(page, 'total')).toHaveText(['0'])
    await press(page, 1)
    await expect(narration(page)).toHaveText('sum is 0 and n is 3, so the callback returns 0 + 3 = 3, the new sum.')
    await expect(rowValues(page, 'total')).toHaveText(['3'])
    await press(page, 5)
    await expect(narration(page)).toHaveText('reduce is done: the total is 32.')
    await expect(variable(page, 'total')).toHaveText('32')
  })

  test('find: stops at the first match, and never looks at the rest', async ({ page }) => {
    await press(page, 20)
    await expect(highlighted(page)).toContainText('nums.find')
    await expect(narration(page)).toHaveText('The callback gets n = 3: 3 > 5 is false, so find keeps looking.')
    await press(page, 2)
    await expect(stepText(page)).toHaveText('Step 23 of 24')
    await expect(narration(page)).toHaveText(
      'The callback gets n = 8: 8 > 5 is true, so find returns 8 and stops. The last 2 items are never looked at.',
    )
    await expect(rowValues(page, 'first')).toHaveText(['8'])
    await press(page, 1)
    await expect(narration(page)).toHaveText(
      'Same list, four results. map, filter and reduce visited all 5 items; find stopped after 3.',
    )
    await expect(variable(page, 'first')).toHaveText('8')
    await expect(page.getByText('Run complete')).toBeVisible()
  })

  test('with predict mode on it asks one question per method, and all four are right for the default list', async ({ page }) => {
    await page.getByRole('switch', { name: 'Predict mode' }).check()
    await page.getByRole('heading', { level: 1 }).click()
    const answerNext = async (question: string, answer: string) => {
      for (let i = 0; i < 30; i++) {
        if (await page.getByRole('heading', { name: question }).isVisible()) break
        await page.keyboard.press('ArrowRight')
      }
      await expect(page.getByRole('heading', { name: question })).toBeVisible()
      await page.getByRole('group', { name: question }).getByRole('button', { name: answer, exact: true }).click()
      await expect(page.getByText('Right!')).toBeVisible()
    }
    await answerNext('How many items will the new list have?', '5')
    await answerNext('How many items will filter keep?', '2')
    await answerNext('What will the final total be?', '32')
    await answerNext('How many items will find check before it stops?', '3')
    await press(page, 3)
    await expect(stepText(page)).toHaveText('Step 24 of 24')
    await expect(page.getByText('You predicted 4 of 4.')).toBeVisible()
  })

  test('a list that is all big: find stops after one item', async ({ page }) => {
    await field(page).fill('9, 7, 6')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 16')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 15)
    await expect(narration(page)).toHaveText(
      'Same list, four results. map, filter and reduce visited all 3 items; find stopped after 1.',
    )
    await expect(variable(page, 'total')).toHaveText('22')
  })

  test('a list where nothing is big: find checks every item and returns undefined', async ({ page }) => {
    await field(page).fill('1, 2')
    await page.getByRole('button', { name: 'Apply' }).click()
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 100)
    await expect(narration(page)).toHaveText(
      'Same list, four results. map, filter and reduce visited all 2 items; find checked all 2 and found nothing.',
    )
    await expect(variable(page, 'first')).toHaveText('undefined')
    await expect(variable(page, 'big')).toHaveText('[]')
  })

  test('an empty list and a seventh number', async ({ page }) => {
    await field(page).fill('')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 7')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 1)
    await expect(narration(page)).toHaveText('map has nothing to visit, so it returns an empty list.')
    await press(page, 3)
    await expect(narration(page)).toHaveText('There are no items, so reduce returns its starting value, 0.')

    await field(page).fill('1 2 3 4 5 6 7')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(page.getByText('Use at most 6 numbers (you entered 7).')).toBeVisible()
    await expect(stepText(page)).toHaveText('Step 5 of 7') // the run in progress is untouched
  })

  test('the quiz completes the topic and earns stars', async ({ page }) => {
    const answers: [string, string][] = [
      ['A list has 5 items. How many items does map return?', 'Always 5'],
      ['What does reduce return for an empty list when its starting value is 0?', 'The start, 0'],
      ['Which of these can stop before it reaches the end of the list?', 'find'],
      ['After nums.map(n => n * 2), what has happened to nums?', 'Unchanged'],
    ]
    for (const [question, option] of answers) {
      await page.getByRole('group', { name: question }).getByRole('radio', { name: option, exact: true }).check()
    }
    await page.getByRole('button', { name: 'Check answers' }).click()
    await expect(page.getByText('You got 4 of 4.')).toBeVisible()
    await page.getByRole('link', { name: /back to the map/i }).click()
    const stage = page.getByRole('listitem', { name: TITLE })
    await expect(stage).toContainText('Completed')
    await expect(stage.getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
  })

  test('the rows of boxes fit a phone with no sideways scrolling', async ({ page }) => {
    await field(page).fill('11, 22, 33, 44, 55, 66')
    await page.getByRole('button', { name: 'Apply' }).click()
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 9) // map is done: six boxes in the list and six in the new list
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
