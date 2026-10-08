import { expect, test, type Page } from '@playwright/test'

const TOPIC = '/#/topic/binary-search'
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
const faded = (page: Page) => page.locator('.array-boxes li[data-mark="dim"]')

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
async function apply(page: Page, text: string) {
  await field(page).fill(text)
  await page.getByRole('button', { name: 'Apply' }).click()
  await page.getByRole('heading', { level: 1 }).click() // so the shortcuts work
}

test.describe('unlocking', () => {
  const upToDuplicateCheck = {
    'sum-demo': { stars: 3 },
    'array-basics': { stars: 3 },
    'map-filter-reduce': { stars: 3 },
    'hidden-loops': { stars: 3 },
    'has-duplicate': { stars: 3 },
  }

  test.describe('before two pointers is done', () => {
    test.use({ storageState: stored(state(upToDuplicateCheck)) })

    test('is locked, and says so', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('listitem', { name: 'Binary search' })).toContainText(
        'Locked. Finish Two pointers to unlock.',
      )
      await page.goto(TOPIC)
      await expect(page.getByRole('heading', { level: 1, name: 'Locked' })).toBeVisible()
    })
  })

  test.describe('after it', () => {
    test.use({ storageState: stored(state({ ...upToDuplicateCheck, 'two-pointers': { stars: 3 } })) })

    test('opens from the map as next up', async ({ page }) => {
      await page.goto('/')
      const stage = page.getByRole('listitem', { name: 'Binary search' })
      await expect(stage.getByText('Next up')).toBeVisible()
      await stage.getByRole('link').click()
      await expect(page.getByRole('heading', { level: 1, name: 'Binary search' })).toBeVisible()
      await expect(stepText(page)).toHaveText('Step 1 of 9')
    })
  })
})

test.describe('the walkthrough', () => {
  test.use({ storageState: stored(state({}, true)) })

  test.beforeEach(async ({ page }) => {
    await page.goto(TOPIC)
    await expect(stepText(page)).toHaveText('Step 1 of 9')
    await page.getByRole('heading', { level: 1 }).click() // so the shortcuts work
  })

  test('has the topic page sections, the dictionary analogy and its source', async ({ page }) => {
    await expect(page.getByText('Looking up a word in a dictionary.')).toBeVisible()
    await expect(page.getByText('Where the analogy breaks:')).toBeVisible()
    await expect(page.getByText('Time O(log n) because')).toBeVisible()
    await expect(page.getByText('1,000,000 items need only about 20 steps')).toBeVisible()
    await expect(page.getByText('Space O(1) because')).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Tech Interview Handbook: Sorting and searching' }),
    ).toHaveAttribute('target', '_blank')
    await expect(page.getByText('Watch first')).toHaveCount(0)
  })

  test('starts with the sorted list and no pointers, then places low and high at the two ends', async ({ page }) => {
    await expect(values(page)).toHaveText(['2', '5', '8', '12', '16', '23', '38', '56', '72', '91'])
    await expect(page.locator('[data-pointer]')).toHaveCount(0)
    await expect(narration(page)).toHaveText(
      'Call binarySearch with [2, 5, 8, 12, 16, 23, 38, 56, 72, 91] and target 23. The list is sorted, so each look can rule out half of it.',
    )
    await press(page, 1)
    await expect(highlighted(page)).toContainText('let low = 0')
    await expect(boxes(page).nth(0)).toContainText('low')
    await press(page, 1)
    await expect(highlighted(page)).toContainText('let high = nums.length - 1')
    await expect(boxes(page).nth(9)).toContainText('high')
    await expect(faded(page)).toHaveCount(0)
  })

  test('picks the middle, marks it and counts the probe', async ({ page }) => {
    await press(page, 3)
    await expect(narration(page)).toHaveText('Probe 1: the middle of positions 0 to 9 is position 4, which holds 16.')
    await expect(highlighted(page)).toContainText('const mid = Math.floor((low + high) / 2)')
    await expect(boxes(page).nth(4)).toHaveAttribute('data-mark', 'current')
    await expect(boxes(page).nth(4)).toContainText('mid')
    await expect(boxes(page).nth(0)).toContainText('low')
    await expect(boxes(page).nth(9)).toContainText('high')
    await expect(variable(page, 'mid')).toHaveText('4')
    await expect(variable(page, 'probes')).toHaveText('1')
  })

  test('a middle that is too small drops the left half: it fades and low moves up', async ({ page }) => {
    await press(page, 4)
    await expect(narration(page)).toHaveText(
      '16 is less than 23, so 23 can only be to the right: drop the left half and set low to 5 (5 numbers left).',
    )
    await expect(highlighted(page)).toContainText('if (nums[mid] < target) low = mid + 1')
    await expect(faded(page)).toHaveCount(5)
    for (let i = 0; i < 5; i++) await expect(boxes(page).nth(i)).toHaveAttribute('data-mark', 'dim')
    await expect(boxes(page).nth(5)).toContainText('low')
    await expect(variable(page, 'low')).toHaveText('5')
  })

  test('a middle that is too big drops the right half, so half the list disappears each round', async ({ page }) => {
    await press(page, 6)
    await expect(narration(page)).toHaveText(
      '56 is more than 23, so 23 can only be to the left: drop the right half and set high to 6 (2 numbers left).',
    )
    await expect(highlighted(page)).toContainText('else high = mid - 1')
    await expect(faded(page)).toHaveCount(8)
    await expect(boxes(page).nth(9)).toHaveAttribute('data-mark', 'dim')
    await expect(boxes(page).nth(6)).toContainText('high')
    await expect(variable(page, 'high')).toHaveText('6')
  })

  test('finds the target, shows it in green and says what a plain scan would have cost', async ({ page }) => {
    await press(page, 8)
    await expect(stepText(page)).toHaveText('Step 9 of 9')
    await expect(highlighted(page)).toContainText('if (nums[mid] === target) return mid')
    await expect(narration(page)).toHaveText(
      '23 is the target, so return 5. That took 3 probes; scanning from the left would have needed 6 comparisons.',
    )
    await expect(boxes(page).nth(5)).toHaveAttribute('data-mark', 'done')
    await expect(variable(page, 'probes')).toHaveText('3')
    await expect(variable(page, 'result')).toHaveText('5')
    await expect(page.getByText('Run complete')).toBeVisible()
  })

  test('with predict mode on it asks after every middle, and all three answers are right for the default list', async ({
    page,
  }) => {
    await page.getByRole('switch', { name: 'Predict mode' }).check()
    await page.getByRole('heading', { level: 1 }).click()
    const answerNext = async (question: string, answer: string) => {
      for (let i = 0; i < 10; i++) {
        if (await page.getByRole('heading', { name: question }).isVisible()) break
        await page.keyboard.press('ArrowRight')
      }
      await expect(page.getByRole('heading', { name: question })).toBeVisible()
      await page.getByRole('group', { name: question }).getByRole('button', { name: answer, exact: true }).click()
      await expect(page.getByText('Right!')).toBeVisible()
    }
    await answerNext('The middle is 16 and the target is 23. What happens next?', 'search the right half')
    await answerNext('The middle is 56 and the target is 23. What happens next?', 'search the left half')
    await answerNext('The middle is 23 and the target is 23. What happens next?', 'stop, it is a match')
    await expect(stepText(page)).toHaveText('Step 9 of 9')
    await expect(page.getByText('You predicted 3 of 3.')).toBeVisible()
  })

  test('a target that is not there: low passes high and nothing is returned', async ({ page }) => {
    await apply(page, '1, 3, 5 target 4')
    await expect(stepText(page)).toHaveText('Step 1 of 8')
    await press(page, 7)
    await expect(highlighted(page)).toContainText('return -1')
    await expect(narration(page)).toHaveText(
      'low (2) has passed high (1), so nothing is left to search: return -1. That took 2 probes; scanning from the left would have needed 3 comparisons.',
    )
    await expect(variable(page, 'result')).toHaveText('-1')
    await expect(faded(page)).toHaveCount(3)
  })

  test('an empty list has nothing to search', async ({ page }) => {
    await apply(page, 'target 4')
    await expect(stepText(page)).toHaveText('Step 1 of 4')
    await press(page, 3)
    await expect(narration(page)).toHaveText(
      'The list is empty, so there is nothing to search: return -1 without a single probe.',
    )
    await expect(variable(page, 'result')).toHaveText('-1')
  })

  test('refuses bad input with a message that says what to fix, and keeps the run going', async ({ page }) => {
    await press(page, 4)
    await expect(stepText(page)).toHaveText('Step 5 of 9')
    const refuse = async (text: string, message: string) => {
      await field(page).fill(text)
      await page.getByRole('button', { name: 'Apply' }).click()
      await expect(page.getByText(message)).toBeVisible()
      await expect(stepText(page)).toHaveText('Step 5 of 9') // the run in progress is untouched
    }
    await refuse(
      '1, 5, 3 target 4',
      'Put the list in order, smallest first: 5 is followed by 3. Binary search only works on a sorted list.',
    )
    await refuse('1, 3, 4', 'Add the target after the list, like "1, 3, 4 target 5".')
    await refuse('1, 3, 4 target 500', 'The target must be between -198 and 198 (found 500).')
    await refuse('1 2 3 4 5 6 7 8 9 10 11 target 5', 'Use at most 10 numbers (you entered 11).')
  })

  test('Random makes a sorted list and a target, and the run starts again', async ({ page }) => {
    await page.getByRole('button', { name: 'Random' }).click()
    await expect(stepText(page)).toHaveText(/^Step 1 of \d+$/)
    await expect(field(page)).toHaveValue(/^\d+(, \d+)+ target \d+$/)
  })

  test('the quiz completes the topic and earns stars', async ({ page }) => {
    const answers: [string, string][] = [
      ['A sorted list has 1,000,000 numbers. About how many steps can binary search need at most?', 'About 20 steps'],
      ['The middle number is smaller than the target. What do you do?', 'Search the right half'],
      ['Why does binary search need a sorted list?', 'Order shows which half to drop'],
      ['How much extra memory does the loop version use?', 'Just low, mid and high'],
    ]
    for (const [question, option] of answers) {
      await page.getByRole('group', { name: question }).getByRole('radio', { name: option, exact: true }).check()
    }
    await page.getByRole('button', { name: 'Check answers' }).click()
    await expect(page.getByText('You got 4 of 4.')).toBeVisible()
    await page.getByRole('link', { name: /back to the map/i }).click()
    const stage = page.getByRole('listitem', { name: 'Binary search' })
    await expect(stage).toContainText('Completed')
    await expect(stage.getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
  })

  test('ten numbers with their pointer tags fit a phone with no sideways scrolling', async ({ page }) => {
    await apply(page, '-99, -80, -60, -40, -20, 0, 20, 40, 60, 99 target 99')
    await expect(stepText(page)).toHaveText(/^Step 1 of \d+$/)
    const viewport = page.viewportSize()!
    for (let step = 0; step < 14; step++) {
      // The last middle has low, mid and high on one box: the widest and tallest case.
      for (const box of await boxes(page).all()) {
        const b = (await box.boundingBox())!
        expect(b.x).toBeGreaterThanOrEqual(0)
        expect(b.x + b.width).toBeLessThanOrEqual(viewport.width)
      }
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      )
      expect(overflows).toBe(false)
      await press(page, 1)
    }
  })

  test('a box does not move or grow when pointers land on it, even three at once', async ({ page }) => {
    // Layout position and size, which a box's pop animation (a transform) does not change.
    const layout = (index: number) => boxes(page).nth(index).evaluate((el) => [el.offsetTop, el.offsetHeight])
    const before = await layout(5)
    await press(page, 7) // low has moved onto the sixth box
    await expect(boxes(page).nth(5)).toContainText('low')
    expect(await layout(5)).toEqual(before)

    await apply(page, '7 target 7')
    const alone = await layout(0)
    await press(page, 3) // low, mid and high all on the only box
    await expect(boxes(page).nth(0)).toContainText('low')
    await expect(boxes(page).nth(0)).toContainText('mid')
    await expect(boxes(page).nth(0)).toContainText('high')
    expect(await layout(0)).toEqual(alone)
  })
})
