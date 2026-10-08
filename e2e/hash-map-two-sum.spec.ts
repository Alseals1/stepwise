import { expect, test, type Page } from '@playwright/test'

const TOPIC = '/#/topic/hash-map-two-sum'
const TITLE = 'Hash map: Two Sum'
const SEEN = 'seen (value → index)'
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
const numsBoxes = (page: Page) => page.getByRole('list', { name: 'nums', exact: true }).getByRole('listitem')
const seenBoxes = (page: Page) => page.getByRole('list', { name: SEEN, exact: true }).getByRole('listitem')
const seenValues = (page: Page) => page.getByRole('list', { name: SEEN, exact: true }).locator('.box-value')
const seenIndexes = (page: Page) => page.getByRole('list', { name: SEEN, exact: true }).locator('.box-index')

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
  // Every stage before this one (binary search too, in case it is built).
  const upToHasDuplicate = {
    'sum-demo': { stars: 3 },
    'array-basics': { stars: 3 },
    'map-filter-reduce': { stars: 3 },
    'hidden-loops': { stars: 3 },
    'has-duplicate': { stars: 3 },
  }

  test.describe('before two pointers is done', () => {
    test.use({ storageState: stored(state(upToHasDuplicate)) })

    test('is locked, and says so', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('listitem', { name: TITLE })).toContainText('Locked. Finish Two pointers to unlock.')
      await page.goto(TOPIC)
      await expect(page.getByRole('heading', { level: 1, name: 'Locked' })).toBeVisible()
    })
  })

  test.describe('after the earlier stages', () => {
    test.use({
      storageState: stored(state({ ...upToHasDuplicate, 'two-pointers': { stars: 3 }, 'binary-search': { stars: 3 } })),
    })

    test('opens from the map', async ({ page }) => {
      await page.goto('/')
      const stage = page.getByRole('listitem', { name: TITLE })
      await expect(stage.getByRole('link')).toBeVisible()
      await stage.getByRole('link').click()
      await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible()
      await expect(stepText(page)).toHaveText('Step 1 of 17')
    })
  })
})

test.describe('the walkthrough', () => {
  test.use({ storageState: stored(state({}, true)) })

  test.beforeEach(async ({ page }) => {
    await page.goto(TOPIC)
    await expect(stepText(page)).toHaveText('Step 1 of 17')
    await page.getByRole('heading', { level: 1 }).click() // so the shortcuts work
  })

  test('has the topic page sections, the coat-check analogy and its source', async ({ page }) => {
    await expect(page.getByText('A coat check where every coat has a number')).toBeVisible()
    await expect(page.getByText('Where the analogy breaks:')).toBeVisible()
    await expect(page.getByText('Time O(n) because')).toBeVisible()
    await expect(page.getByText('Space O(n) because')).toBeVisible()
    await expect(page.getByRole('link', { name: 'MDN: Map' })).toHaveAttribute('target', '_blank')
    await expect(page.getByText('Watch first')).toHaveCount(0)
  })

  test('starts with an unsorted list and an empty Map', async ({ page }) => {
    await expect(numsBoxes(page).locator('.box-value')).toHaveText(['7', '2', '5', '9', '3', '6'])
    await expect(narration(page)).toHaveText('Call twoSumHash with [7, 2, 5, 9, 3, 6] and target 10. The list can be in any order.')
    await expect(highlighted(page)).toContainText('function twoSumHash(nums, target) {')
    await press(page, 1)
    await expect(highlighted(page)).toContainText('const seen = new Map()')
    await expect(page.getByRole('list', { name: SEEN, exact: true })).toHaveCount(0) // an empty Map shows "Empty array"
    await expect(page.getByText('Empty array')).toBeVisible()
    await expect(variable(page, 'lookups')).toHaveText('0')
  })

  test('each item: the complement, then the lookup, then the store, and the Map fills with value and index', async ({ page }) => {
    await press(page, 2)
    await expect(stepText(page)).toHaveText('Step 3 of 17')
    await expect(narration(page)).toHaveText('The partner of 7 must be 10 - 7 = 3, so 3 is what we look for.')
    await expect(highlighted(page)).toContainText('const complement = target - nums[i]')
    await expect(variable(page, 'complement')).toHaveText('3')
    await expect(variable(page, 'i')).toHaveText('0')
    await expect(variable(page, 'lookups')).toHaveText('0')
    await expect(numsBoxes(page).nth(0)).toHaveAttribute('data-mark', 'current')

    await press(page, 1)
    await expect(narration(page)).toHaveText(
      'seen.has(3) looks in the Map in one step: 3 is not there, so no earlier number pairs with 7.',
    )
    await expect(highlighted(page)).toContainText('if (seen.has(complement)) {')
    await expect(variable(page, 'lookups')).toHaveText('1')

    await press(page, 1)
    await expect(narration(page)).toHaveText(
      '7 has no partner yet, so seen.set(7, 0) stores it with its index for later items to find.',
    )
    await expect(highlighted(page)).toContainText('seen.set(nums[i], i)')
    await expect(seenValues(page)).toHaveText(['7'])
    await expect(seenIndexes(page)).toHaveText(['0'])

    await press(page, 3) // item 2 (value 2): complement, lookup, store
    await expect(seenValues(page)).toHaveText(['7', '2'])
    await expect(seenIndexes(page)).toHaveText(['0', '1'])
    await expect(seenBoxes(page).nth(1)).toHaveAttribute('data-mark', 'current')
  })

  test('an item never pairs with itself: 5 looks for 5 and does not find it', async ({ page }) => {
    await press(page, 8)
    await expect(narration(page)).toHaveText('The partner of 5 must be 10 - 5 = 5, so 5 is what we look for.')
    await press(page, 1)
    await expect(narration(page)).toHaveText(
      'seen.has(5) looks in the Map in one step: 5 is not there, so no earlier number pairs with 5. An item is stored only after its lookup, so it can never pair with itself.',
    )
    await expect(seenValues(page)).toHaveText(['7', '2'])
  })

  test('finds 7 in the Map for the item 3: both numbers and the stored value turn green, and it returns [0, 4]', async ({ page }) => {
    await press(page, 15)
    await expect(stepText(page)).toHaveText('Step 16 of 17')
    await expect(narration(page)).toHaveText('seen.has(7) looks in the Map in one step: 7 is there, stored at index 0, and 7 + 3 = 10.')
    await expect(numsBoxes(page).nth(0)).toHaveAttribute('data-mark', 'done')
    await expect(numsBoxes(page).nth(4)).toHaveAttribute('data-mark', 'done')
    await expect(seenBoxes(page).nth(0)).toHaveAttribute('data-mark', 'done')
    await expect(variable(page, 'lookups')).toHaveText('5')

    await press(page, 1)
    await expect(stepText(page)).toHaveText('Step 17 of 17')
    await expect(highlighted(page)).toContainText('return [seen.get(complement), i]')
    await expect(narration(page)).toHaveText(
      'Return [0, 4]: the stored index first, then this one. That took 5 lookups; nested loops could have needed up to 15 pairs. It works on any order but the Map holds up to n items, where two pointers needs a sorted list and no extra memory.',
    )
    await expect(variable(page, 'result')).toHaveText('[0, 4]')
    await expect(page.getByText('Run complete')).toBeVisible()
  })

  test('with predict mode on it asks three questions, and all three answers are right', async ({ page }) => {
    await page.getByRole('switch', { name: 'Predict mode' }).check()
    await page.getByRole('heading', { level: 1 }).click()
    const answerNext = async (question: string, answer: string) => {
      for (let i = 0; i < 18; i++) {
        if (await page.getByRole('heading', { name: question }).isVisible()) break
        await page.keyboard.press('ArrowRight')
      }
      await expect(page.getByRole('heading', { name: question })).toBeVisible()
      await page.getByRole('group', { name: question }).getByRole('button', { name: answer, exact: true }).click()
      await expect(page.getByText('Right!')).toBeVisible()
    }
    await answerNext('The target is 10 and this number is 2. What complement do we look for?', '8')
    await answerNext('Is 5 already stored in the Map?', 'No')
    await answerNext('Is 7 already stored in the Map?', 'Yes')
    await expect(stepText(page)).toHaveText('Step 16 of 17')
    await press(page, 1)
    await expect(stepText(page)).toHaveText('Step 17 of 17')
    await expect(page.getByText('You predicted 3 of 3.')).toBeVisible()
  })

  test('a wrong prediction is explained and the run carries on', async ({ page }) => {
    await page.getByRole('switch', { name: 'Predict mode' }).check()
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 8)
    const question = 'The target is 10 and this number is 2. What complement do we look for?'
    await expect(page.getByRole('heading', { name: question })).toBeVisible()
    await page.getByRole('group', { name: question }).getByRole('button', { name: '12', exact: true }).click()
    await expect(page.getByText('The partner is the target minus this number: 10 - 2 = 8.')).toBeVisible()
  })

  test('a list with no pair: every item is looked up and stored, then it returns []', async ({ page }) => {
    await field(page).fill('1, 2, 4 target 100')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 12')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 11)
    await expect(highlighted(page)).toContainText('return []')
    await expect(narration(page)).toHaveText(
      'Every item has been looked up and none found a partner, so return []. That took 3 lookups, against 3 pairs for nested loops, and the Map ended up holding 3 items.',
    )
    await expect(seenValues(page)).toHaveText(['1', '2', '4'])
    await expect(variable(page, 'result')).toHaveText('[]')
  })

  test('an empty list and a single number have nothing to pair', async ({ page }) => {
    await field(page).fill('target 4')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 3')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 2)
    await expect(narration(page)).toHaveText('The list is empty, so there is nothing to look up: return [].')

    await field(page).fill('5 target 5')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 6')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 5)
    await expect(narration(page)).toHaveText(
      'Every item has been looked up and none found a partner, so return []. That took 1 lookup, against 0 pairs for nested loops, and the Map ended up holding 1 item.',
    )
  })

  test('[3, 3] with target 6: the second 3 finds the first 3 in the Map', async ({ page }) => {
    await field(page).fill('3, 3 target 6')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 8')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 6)
    await expect(narration(page)).toHaveText('seen.has(3) looks in the Map in one step: 3 is there, stored at index 0, and 3 + 3 = 6.')
    await press(page, 1)
    await expect(variable(page, 'result')).toHaveText('[0, 1]')
    await expect(numsBoxes(page).nth(0)).toHaveAttribute('data-mark', 'done')
    await expect(numsBoxes(page).nth(1)).toHaveAttribute('data-mark', 'done')
  })

  test('a repeated value replaces its index in the Map instead of adding a box', async ({ page }) => {
    await field(page).fill('2, 2, 9 target 20')
    await page.getByRole('button', { name: 'Apply' }).click()
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 7) // item 1: complement, lookup, store
    await expect(narration(page)).toHaveText('2 is already in the Map (at index 0), so seen.set(2, 1) replaces its index with 1.')
    await expect(seenValues(page)).toHaveText(['2'])
    await expect(seenIndexes(page)).toHaveText(['1'])
  })

  test('accepts an unsorted list, and refuses bad input with a message that says what to fix', async ({ page }) => {
    await press(page, 4)
    await expect(stepText(page)).toHaveText('Step 5 of 17')
    const refuse = async (text: string, message: string) => {
      await field(page).fill(text)
      await page.getByRole('button', { name: 'Apply' }).click()
      await expect(page.getByText(message)).toBeVisible()
      await expect(stepText(page)).toHaveText('Step 5 of 17') // the run in progress is untouched
    }
    await refuse('9, 1, 4', 'Add the target after the list, like "1, 3, 4 target 5".')
    await refuse('9, 1, 4 target 500', 'The target must be between -198 and 198 (found 500).')
    await refuse('9, x, 4 target 5', '"x" isn’t a number.')
    await refuse('1 2 3 4 5 6 7 8 9 target 5', 'Use at most 8 numbers (you entered 9).')

    await field(page).fill('9, 1, 4 target 5') // not in order, and that is fine here
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 11')
    await expect(numsBoxes(page).locator('.box-value')).toHaveText(['9', '1', '4'])
  })

  test('Random makes a list and a target, and the run starts again', async ({ page }) => {
    await page.getByRole('button', { name: 'Random' }).click()
    await expect(stepText(page)).toHaveText(/^Step 1 of \d+$/)
    await expect(field(page)).toHaveValue(/^\d+(, \d+)+ target \d+$/)
  })

  test('the quiz completes the topic and earns stars', async ({ page }) => {
    const answers: [string, string][] = [
      ['The target is 10 and the current item is 4. What does the code look up?', '6'],
      ['What does the Map store for each item?', 'Its value and index'],
      ['Why is the lookup done before the item is stored?', 'So no item pairs itself'],
      ['Compared with two pointers, what does the Map version spend?', 'Extra memory'],
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

  test('eight numbers and a full Map fit a phone with no sideways scrolling', async ({ page }) => {
    await field(page).fill('-99, 50, -20, 0, 5, 20, 99, -50 target 197')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 27')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 26)
    await expect(seenBoxes(page)).toHaveCount(8)
    const viewport = page.viewportSize()!
    for (const box of [...(await numsBoxes(page).all()), ...(await seenBoxes(page).all())]) {
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
