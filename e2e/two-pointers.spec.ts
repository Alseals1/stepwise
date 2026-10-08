import { expect, test, type Page } from '@playwright/test'

const TOPIC = '/#/topic/two-pointers'
const stepText = (page: Page) => page.locator('.controls-step')
const narration = (page: Page) => page.getByRole('status')
const field = (page: Page) => page.getByRole('textbox', { name: 'List and target' })
const variable = (page: Page, name: string) =>
  page
    .getByRole('region', { name: 'Variables' })
    .locator('.variable')
    .filter({ has: page.locator('dt', { hasText: new RegExp(`^${name}$`) }) })
    .locator('dd')
const highlighted = (page: Page) => page.locator('.code-panel [aria-current="step"]')
const boxes = (page: Page) => page.getByRole('list', { name: 'Array' }).getByRole('listitem')
const values = (page: Page) => page.getByRole('list', { name: 'Array' }).locator('.box-value')

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
  const upToHiddenLoop = {
    'sum-demo': { stars: 3 },
    'array-basics': { stars: 3 },
    'map-filter-reduce': { stars: 3 },
    'hidden-loops': { stars: 3 },
  }

  test.describe('before the duplicate check is done', () => {
    test.use({ storageState: stored(state(upToHiddenLoop)) })

    test('is locked, and says so', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('listitem', { name: 'Two pointers' })).toContainText(
        'Locked. Finish Duplicate check: loops vs a Set to unlock.',
      )
      await page.goto(TOPIC)
      await expect(page.getByRole('heading', { level: 1, name: 'Locked' })).toBeVisible()
    })
  })

  test.describe('after it', () => {
    test.use({ storageState: stored(state({ ...upToHiddenLoop, 'has-duplicate': { stars: 3 } })) })

    test('opens from the map as next up', async ({ page }) => {
      await page.goto('/')
      const stage = page.getByRole('listitem', { name: 'Two pointers' })
      await expect(stage.getByText('Next up')).toBeVisible()
      await stage.getByRole('link').click()
      await expect(page.getByRole('heading', { level: 1, name: 'Two pointers' })).toBeVisible()
      await expect(stepText(page)).toHaveText('Step 1 of 13')
    })
  })
})

test.describe('the walkthrough', () => {
  test.use({ storageState: stored(state({}, true)) })

  test.beforeEach(async ({ page }) => {
    await page.goto(TOPIC)
    await expect(stepText(page)).toHaveText('Step 1 of 13')
    await page.getByRole('heading', { level: 1 }).click() // so the shortcuts work
  })

  test('has the topic page sections, the gift-card analogy and its source', async ({ page }) => {
    await expect(page.getByText('Spending a gift card exactly.')).toBeVisible()
    await expect(page.getByText('Where the analogy breaks:')).toBeVisible()
    await expect(page.getByText('Time O(n) because')).toBeVisible()
    await expect(page.getByText('Space O(1) because')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Tech Interview Handbook: Two pointers' })).toHaveAttribute('target', '_blank')
    await expect(page.getByText('Watch first')).toHaveCount(0)
  })

  test('starts with the sorted list and no pointers, then places left and right at the two ends', async ({ page }) => {
    await expect(values(page)).toHaveText(['1', '3', '4', '6', '8', '11'])
    await expect(page.locator('[data-pointer]')).toHaveCount(0)
    await expect(narration(page)).toHaveText(
      'Call twoSumSorted with [1, 3, 4, 6, 8, 11] and target 10. The list is sorted, so we can start from both ends.',
    )
    await press(page, 1)
    await expect(highlighted(page)).toContainText('let left = 0')
    await expect(boxes(page).nth(0)).toContainText('left')
    await press(page, 1)
    await expect(highlighted(page)).toContainText('let right = nums.length - 1')
    await expect(boxes(page).nth(5)).toContainText('right')
  })

  test('a sum that is too big drops the right number: it fades and the right tag moves left', async ({ page }) => {
    await press(page, 3)
    await expect(narration(page)).toHaveText('Add the two ends: 1 + 11 = 12. The target is 10.')
    await expect(highlighted(page)).toContainText('const sum = nums[left] + nums[right]')
    await expect(variable(page, 'sum')).toHaveText('12')
    await expect(variable(page, 'sums')).toHaveText('1')
    await press(page, 1)
    await expect(narration(page)).toHaveText(
      '12 is more than 10, so 11 is too big for every number still in play: drop it and move right one step left.',
    )
    await expect(highlighted(page)).toContainText('else right--')
    await expect(boxes(page).nth(5)).toHaveAttribute('data-mark', 'dim')
    await expect(boxes(page).nth(4)).toContainText('right')
    await expect(variable(page, 'right')).toHaveText('4')
  })

  test('a sum that is too small drops the left number: it fades and the left tag moves right', async ({ page }) => {
    await press(page, 6)
    await expect(narration(page)).toHaveText(
      '9 is less than 10, so 1 is too small for every number still in play: drop it and move left one step right.',
    )
    await expect(highlighted(page)).toContainText('if (sum < target) left++')
    await expect(boxes(page).nth(0)).toHaveAttribute('data-mark', 'dim')
    await expect(boxes(page).nth(1)).toContainText('left')
  })

  test('finds the pair, shows it in green and says what the shortcut saved', async ({ page }) => {
    await press(page, 12)
    await expect(stepText(page)).toHaveText('Step 13 of 13')
    await expect(highlighted(page)).toContainText('if (sum === target) return [left, right]')
    await expect(narration(page)).toHaveText(
      '4 + 6 = 10, a match, so return [2, 3]. That took 5 sums; nested loops could have needed up to 15 pairs.',
    )
    await expect(boxes(page).nth(2)).toHaveAttribute('data-mark', 'done')
    await expect(boxes(page).nth(3)).toHaveAttribute('data-mark', 'done')
    await expect(variable(page, 'sums')).toHaveText('5')
    await expect(variable(page, 'result')).toHaveText('[2, 3]')
    await expect(page.getByText('Run complete')).toBeVisible()
  })

  test('with predict mode on it asks after every sum, and all five answers are right for the default list', async ({ page }) => {
    await page.getByRole('switch', { name: 'Predict mode' }).check()
    await page.getByRole('heading', { level: 1 }).click()
    const answerNext = async (question: string, answer: string) => {
      for (let i = 0; i < 14; i++) {
        if (await page.getByRole('heading', { name: question }).isVisible()) break
        await page.keyboard.press('ArrowRight')
      }
      await expect(page.getByRole('heading', { name: question })).toBeVisible()
      await page.getByRole('group', { name: question }).getByRole('button', { name: answer, exact: true }).click()
      await expect(page.getByText('Right!')).toBeVisible()
    }
    await answerNext('1 + 11 = 12 and the target is 10. What happens next?', 'right moves left')
    await answerNext('1 + 8 = 9 and the target is 10. What happens next?', 'left moves right')
    await answerNext('3 + 8 = 11 and the target is 10. What happens next?', 'right moves left')
    await answerNext('3 + 6 = 9 and the target is 10. What happens next?', 'left moves right')
    await answerNext('4 + 6 = 10 and the target is 10. What happens next?', 'it is a match')
    await expect(stepText(page)).toHaveText('Step 13 of 13')
    await expect(page.getByText('You predicted 5 of 5.')).toBeVisible()
  })

  test('a list with no pair: the pointers meet and nothing is returned', async ({ page }) => {
    await field(page).fill('1, 2, 3 target 10')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 8')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 6)
    await expect(boxes(page).nth(2)).toContainText('left')
    await expect(boxes(page).nth(2)).toContainText('right') // both on the last number
    await press(page, 1)
    await expect(highlighted(page)).toContainText('return []')
    await expect(narration(page)).toHaveText(
      'left and right have met, so every number is ruled out and no pair adds up to 10: return [].',
    )
    await expect(variable(page, 'result')).toHaveText('[]')
  })

  test('an empty list and a single number have nothing to pair', async ({ page }) => {
    await field(page).fill('target 4')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 4')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 3)
    await expect(narration(page)).toHaveText('A pair needs two numbers, and the list has none: return [].')

    await field(page).fill('5 target 5')
    await page.getByRole('button', { name: 'Apply' }).click()
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 3)
    await expect(narration(page)).toHaveText('A pair needs two numbers, and the list has only one: return [].')
  })

  test('refuses bad input with a message that says what to fix, and keeps the run going', async ({ page }) => {
    await press(page, 4)
    await expect(stepText(page)).toHaveText('Step 5 of 13')
    const refuse = async (text: string, message: string) => {
      await field(page).fill(text)
      await page.getByRole('button', { name: 'Apply' }).click()
      await expect(page.getByText(message)).toBeVisible()
      await expect(stepText(page)).toHaveText('Step 5 of 13') // the run in progress is untouched
    }
    await refuse(
      '1, 5, 3 target 4',
      'Put the list in order, smallest first: 5 is followed by 3. Two pointers only works on a sorted list.',
    )
    await refuse('1, 3, 4', 'Add the target after the list, like "1, 3, 4 target 5".')
    await refuse('1, 3, 4 target 500', 'The target must be between -198 and 198 (found 500).')
    await refuse('1 2 3 4 5 6 7 8 9 target 5', 'Use at most 8 numbers (you entered 9).')
  })

  test('Random makes a sorted list and a target, and the run starts again', async ({ page }) => {
    await page.getByRole('button', { name: 'Random' }).click()
    await expect(stepText(page)).toHaveText(/^Step 1 of \d+$/)
    await expect(field(page)).toHaveValue(/^\d+(, \d+)+ target \d+$/)
  })

  test('the quiz completes the topic and earns stars', async ({ page }) => {
    const answers: [string, string][] = [
      ['The sum of the two ends is too big. What should you do?', 'Move right one step left'],
      ['Why does the two-pointer method take O(n) time?', 'Each move drops a number'],
      ['Does this method work on an unsorted list?', 'No, it needs order'],
      ['How much extra memory does it need?', 'Just two pointers'],
    ]
    for (const [question, option] of answers) {
      await page.getByRole('group', { name: question }).getByRole('radio', { name: option, exact: true }).check()
    }
    await page.getByRole('button', { name: 'Check answers' }).click()
    await expect(page.getByText('You got 4 of 4.')).toBeVisible()
    await page.getByRole('link', { name: /back to the map/i }).click()
    const stage = page.getByRole('listitem', { name: 'Two pointers' })
    await expect(stage).toContainText('Completed')
    await expect(stage.getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
  })

  test('eight numbers with their pointer tags fit a phone with no sideways scrolling', async ({ page }) => {
    await field(page).fill('-99, -50, -20, 0, 5, 20, 50, 99 target 0')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText(/^Step 1 of \d+$/)
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 4)
    const viewport = page.viewportSize()!
    for (const box of await boxes(page).all()) {
      const b = (await box.boundingBox())!
      expect(b.x).toBeGreaterThanOrEqual(0)
      expect(b.x + b.width).toBeLessThanOrEqual(viewport.width)
    }
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(overflows).toBe(false)
  })

  test('a box does not move when a pointer lands on it', async ({ page }) => {
    await press(page, 2)
    // Layout position and size, which a box's pop animation (a transform) does not change.
    const layout = () => boxes(page).nth(1).evaluate((el) => [el.offsetTop, el.offsetHeight])
    const before = await layout()
    await press(page, 5) // left reaches the second box
    await expect(boxes(page).nth(1)).toContainText('left')
    expect(await layout()).toEqual(before)
  })
})
