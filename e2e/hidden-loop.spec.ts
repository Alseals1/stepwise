import { expect, test, type Page } from '@playwright/test'

const TOPIC = '/#/topic/hidden-loops'
const stepText = (page: Page) => page.locator('.controls-step')
const narration = (page: Page) => page.getByRole('status')
const field = (page: Page) => page.getByRole('textbox', { name: 'List' })
const comparisons = (page: Page) =>
  page.getByRole('region', { name: 'Variables' }).locator('.variable', { hasText: 'comparisons' }).locator('dd')
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

test.describe('unlocking, with "map, filter and reduce" still unbuilt', () => {
  test.use({ storageState: stored(state({ 'sum-demo': { stars: 3 } })) })

  test('is locked until Array basics is done, and says so', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('listitem', { name: 'The hidden loop' })).toContainText(
      'Locked. Finish Array basics to unlock.',
    )
    await page.goto(TOPIC)
    await expect(page.getByRole('heading', { level: 1, name: 'Locked' })).toBeVisible()
    await expect(page.getByText(/Finish Array basics to unlock this topic/)).toBeVisible()
  })
})

test.describe('unlocked', () => {
  test.use({ storageState: stored(state({ 'sum-demo': { stars: 3 }, 'array-basics': { stars: 3 } })) })

  test('opens from the map as next up, even though the stage before it is still coming soon', async ({ page }) => {
    await page.goto('/')
    const stage = page.getByRole('listitem', { name: 'The hidden loop' })
    await expect(stage.getByText('Next up')).toBeVisible()
    await expect(page.getByRole('listitem', { name: 'map, filter and reduce' })).toContainText('Coming soon')
    await stage.getByRole('link').click()
    await expect(page.getByRole('heading', { level: 1, name: 'The hidden loop' })).toBeVisible()
    await expect(stepText(page)).toHaveText('Step 1 of 15')
  })
})

test.describe('the walkthrough', () => {
  test.use({ storageState: stored(state({}, true)) })

  test.beforeEach(async ({ page }) => {
    await page.goto(TOPIC)
    await expect(stepText(page)).toHaveText('Step 1 of 15')
    await page.getByRole('heading', { level: 1 }).click() // so the shortcuts work
  })

  test('has the topic page sections and the bouncer analogy', async ({ page }) => {
    await expect(page.getByText('A club bouncer with a paper guest list.')).toBeVisible()
    await expect(page.getByText('Where the analogy breaks:')).toBeVisible()
    await expect(page.getByText('Time O(n²) because')).toBeVisible()
    await expect(page.getByRole('link', { name: /MDN: Array.prototype.includes/ })).toHaveAttribute('target', '_blank')
    await expect(page.getByText('Watch first')).toHaveCount(0)
  })

  test('shows two rows, items and seen, and builds seen as it goes', async ({ page }) => {
    await expect(rowValues(page, 'items')).toHaveText(['3', '1', '4', '1'])
    await expect(page.getByText('Empty array')).toBeVisible() // seen starts empty
    await press(page, 3) // pick 3, includes on an empty seen, push
    await expect(rowValues(page, 'seen')).toHaveText(['3'])
    await expect(narration(page)).toHaveText('3 is new, so push adds it to seen.')
  })

  test('one line of code becomes many steps: the includes line stays highlighted while it scans', async ({ page }) => {
    const lines: string[] = []
    for (let step = 1; step < 15; step++) {
      await page.keyboard.press('ArrowRight')
      lines.push((await highlighted(page).textContent()) ?? '')
    }
    // One line, seen.includes(item), is on screen for 7 of the 14 steps: the empty check, each of the
    // 5 comparisons, and the early return. That single line is the hidden loop.
    expect(lines.filter((l) => l.includes('seen.includes(item)'))).toHaveLength(7)
    expect(lines.filter((l) => l.includes('seen.push(item)'))).toHaveLength(3)
  })

  test('counts every comparison, one at a time, ending at 5 for [3, 1, 4, 1]', async ({ page }) => {
    await expect(comparisons(page)).toHaveText('0')
    await press(page, 5) // 3: pick, empty includes, push; 1: pick, the first comparison
    await expect(narration(page)).toHaveText('includes compares 1 with 3: not equal, so it keeps looking.')
    await expect(comparisons(page)).toHaveText('1')
    await press(page, 9) // to the end
    await expect(stepText(page)).toHaveText('Step 15 of 15')
    await expect(comparisons(page)).toHaveText('5')
  })

  test('stops at the first match and returns true right away: a visible early return', async ({ page }) => {
    await press(page, 13) // up to the match
    await expect(narration(page)).toHaveText('includes compares 1 with 1: a match, so it stops right away.')
    await expect(page.getByRole('list', { name: 'seen' }).locator('li[data-mark="done"]')).toHaveCount(1)
    await press(page, 1)
    await expect(narration(page)).toHaveText('The condition is true, so return true runs and the function stops right away.')
    await expect(stepText(page)).toHaveText('Step 15 of 15')
    await expect(page.getByText('Run complete')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Variables' }).locator('.variable', { hasText: 'returned' }).locator('dd')).toHaveText('true')
  })

  test('a list with no duplicate scans everything: 0 + 1 + 2 + 3 = 6 comparisons, then return false', async ({ page }) => {
    await field(page).fill('4, 7, 2, 9')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 17')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 16)
    await expect(stepText(page)).toHaveText('Step 17 of 17')
    await expect(narration(page)).toHaveText('Every item was new, so return false.')
    await expect(comparisons(page)).toHaveText('6')
    await expect(rowValues(page, 'seen')).toHaveText(['4', '7', '2', '9'])
  })

  test('with predict mode on, it asks how many comparisons each includes will make', async ({ page }) => {
    await page.getByRole('switch', { name: 'Predict mode' }).check()
    const answerNext = async (item: number, answer: string) => {
      for (let i = 0; i < 6; i++) {
        if (await page.getByRole('group', { name: /^How many comparisons/ }).isVisible()) break
        await page.keyboard.press('ArrowRight')
      }
      await expect(page.getByRole('heading', { name: `How many comparisons will includes make for ${item}?` })).toBeVisible()
      await page.getByRole('group', { name: /^How many comparisons/ }).getByRole('button', { name: answer, exact: true }).click()
      await expect(page.getByText('Right!')).toBeVisible()
    }
    await page.getByRole('heading', { level: 1 }).click()
    await answerNext(3, '0') // seen is empty
    await answerNext(1, '1') // not in seen: all of seen
    await answerNext(4, '2') // not in seen: all of seen
    await answerNext(1, '2') // stops at the first match, at index 1
    await expect(page.getByText('includes stops at the first match, at index 1, so it makes 2 comparisons.')).toBeVisible()
    await press(page, 2) // the match, then return true (the question was about the first comparison)
    await expect(stepText(page)).toHaveText('Step 15 of 15')
    await expect(page.getByText('You predicted 4 of 4.')).toBeVisible()
  })

  test('your own list: 9, 9 finds a duplicate straight away, and an empty list returns false at once', async ({ page }) => {
    await field(page).fill('9, 9')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 7')
    await field(page).fill('')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 2')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 1)
    await expect(narration(page)).toHaveText('Every item was new, so return false.')
    await expect(comparisons(page)).toHaveText('0')
  })

  test('refuses a seventh number, saying why', async ({ page }) => {
    await field(page).fill('1 2 3 4 5 6 7')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(page.getByText('Use at most 6 numbers (you entered 7).')).toBeVisible()
    await expect(stepText(page)).toHaveText('Step 1 of 15')
  })

  test('the quiz completes the topic and earns stars', async ({ page }) => {
    const answers: [string, string][] = [
      ['Which line of hasDuplicate secretly loops over seen?', 'the includes call'],
      ['Four different items go in. How many comparisons does includes make in total?', '6'],
      ['Why can hasDuplicate finish before it has read every item?', 'return stops the function'],
    ]
    for (const [question, option] of answers) {
      await page.getByRole('group', { name: question }).getByRole('radio', { name: option, exact: true }).check()
    }
    await page.getByRole('button', { name: 'Check answers' }).click()
    await expect(page.getByText('You got 3 of 3.')).toBeVisible()
    await page.getByRole('link', { name: /back to the map/i }).click()
    const stage = page.getByRole('listitem', { name: 'The hidden loop' })
    await expect(stage).toContainText('Completed')
    await expect(stage.getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
  })

  test('two rows of six boxes fit a phone with no sideways scrolling', async ({ page }) => {
    await field(page).fill('1 2 3 4 5 6')
    await page.getByRole('button', { name: 'Apply' }).click()
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 20) // far enough that seen holds several boxes too
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
