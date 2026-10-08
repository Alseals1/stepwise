import { expect, test, type Page } from '@playwright/test'
import { passQuiz } from './helpers'

const TOPIC = '/#/topic/array-basics'
const stepText = (page: Page) => page.locator('.controls-step')
const seats = (page: Page) => page.getByRole('list', { name: 'Seats' }).getByRole('listitem')
/** The boxes' labels in seat order. (They sit in a fixed order in the page, by identity, so they can glide.) */
const labels = (page: Page) =>
  seats(page).evaluateAll((els) =>
    els
      .map((el) => el.getAttribute('aria-label') ?? '')
      .sort((a, b) => Number(/^Seat (\d+)/.exec(a)![1]) - Number(/^Seat (\d+)/.exec(b)![1])),
  )
const field = (page: Page) => page.getByRole('textbox', { name: 'Starting array' })
const next = (page: Page, times = 1) => page.keyboard.press('ArrowRight', { delay: 0 }).then(async () => {
  for (let i = 1; i < times; i++) await page.keyboard.press('ArrowRight')
})

/** Every test except the locked-page ones starts with all topics open and the tour seen. */
const OPEN = {
  version: 1,
  completed: {},
  unlockAll: true,
  runs: {},
  settings: { language: 'js', speed: 1, predictMode: false },
  streak: { current: 0, longest: 0, lastStudyDay: null, freezeUsedWeek: null },
  badges: {},
  help: { tourSeen: true },
}
const open = {
  cookies: [],
  origins: [{ origin: 'http://localhost:5173', localStorage: [{ name: 'stepwise:v1', value: JSON.stringify(OPEN) }] }],
}

test.describe('when it is locked', () => {
  test('a direct link names what to finish first, and the map shows it locked', async ({ page }) => {
    await page.goto(TOPIC)
    await expect(page.getByRole('heading', { level: 1, name: 'Locked' })).toBeVisible()
    await expect(page.getByText(/Finish Warm-up: Add up the numbers to unlock this topic/)).toBeVisible()
    await page.getByRole('link', { name: /back to the map/i }).click()
    await expect(page.getByRole('listitem', { name: 'Array basics' }).getByRole('link')).toHaveCount(0)
  })

  test('finishing the warm-up unlocks it, marks it next up, and it opens', async ({ page }) => {
    await page.goto('/#/topic/sum-demo')
    await passQuiz(page)
    await page.getByRole('link', { name: /back to the map/i }).click()
    const arrayBasics = page.getByRole('listitem', { name: 'Array basics' })
    await expect(arrayBasics.getByText('Next up')).toBeVisible()
    await arrayBasics.getByRole('link').click()
    await expect(page.getByRole('heading', { level: 1, name: 'Array basics' })).toBeVisible()
    await expect(stepText(page)).toHaveText('Step 1 of 13')
  })
})

test.describe('the walkthrough', () => {
  test.use({ storageState: open })

  test.beforeEach(async ({ page }) => {
    await page.goto(TOPIC)
    await expect(stepText(page)).toHaveText('Step 1 of 13')
  })

  test('has the topic page sections, and no video link because none has been verified', async ({ page }) => {
    await expect(page.getByText('What this does')).toBeVisible()
    await expect(page.getByText('A row of cinema seats.')).toBeVisible()
    await expect(page.getByText('Where the analogy breaks:')).toBeVisible()
    await expect(page.getByText('Time O(1) or O(n) because')).toBeVisible()
    await expect(page.getByRole('link', { name: /Tech Interview Handbook/ })).toHaveAttribute('target', '_blank')
    await expect(page.getByText('Watch first')).toHaveCount(0)
  })

  test('walks through push, unshift, pop and shift, one element at a time', async ({ page }) => {
    expect(await labels(page)).toEqual(['Seat 0: 3', 'Seat 1: 5', 'Seat 2: 8'])
    await next(page) // push
    await expect(page.getByRole('status')).toHaveText('push(9) puts 9 in the next free seat at the end, so nothing else moves.')
    expect(await labels(page)).toEqual(['Seat 0: 3', 'Seat 1: 5', 'Seat 2: 8', 'Seat 3: 9'])

    await next(page) // unshift: the last element slides first
    await expect(page.getByRole('status')).toHaveText('unshift(1) needs seat 0, so the element in seat 3 slides to seat 4.')
    expect(await labels(page)).toEqual(['Seat 0: 3', 'Seat 1: 5', 'Seat 2: 8', 'Seat 4: 9'])
    await next(page, 3)
    expect(await labels(page)).toEqual(['Seat 1: 3', 'Seat 2: 5', 'Seat 3: 8', 'Seat 4: 9'])
    await next(page) // 1 goes in
    expect(await labels(page)).toEqual(['Seat 0: 1', 'Seat 1: 3', 'Seat 2: 5', 'Seat 3: 8', 'Seat 4: 9'])

    await next(page) // pop
    await expect(page.getByRole('status')).toHaveText('pop() removes the last element, 9, and returns it, so nothing else moves.')
    expect(await labels(page)).toContain('Seat 4: 9 (removed)')

    await next(page) // shift
    await expect(page.getByRole('status')).toHaveText('shift() removes the first element, 1, and returns it.')
    expect(await labels(page)).toContain('Seat 0: 1 (removed)')
    await next(page, 4)
    await expect(page.getByRole('status')).toHaveText('Return the array: [3, 5, 8].')
    expect(await labels(page)).toEqual(['Seat 0: 3', 'Seat 1: 5', 'Seat 2: 8'])
    await expect(stepText(page)).toHaveText('Step 13 of 13')
  })

  test('counts every element moved, so the cost of the front shows: 7 for three elements', async ({ page }) => {
    const moves = page.getByRole('region', { name: 'Variables' }).locator('.variable', { hasText: 'moves' }).locator('dd')
    await expect(moves).toHaveText('0')
    await next(page, 2) // push, then unshift's first move
    await expect(moves).toHaveText('1')
    await next(page, 11)
    await expect(stepText(page)).toHaveText('Step 13 of 13')
    await expect(moves).toHaveText('7')
    await expect(page.getByText('Run complete')).toBeVisible()
  })

  test('a box really glides: its position changes by one seat between steps, with a transition', async ({ page }) => {
    await next(page) // push puts 9 in seat 3
    const nine = () => page.getByRole('listitem', { name: /: 9$/ })
    const xAt = async () => (await nine().boundingBox())!.x
    await page.waitForTimeout(600) // let its pop-in finish, so it is measured at full size
    const before = await xAt()
    const transition = await nine().evaluate((el) => getComputedStyle(el).transitionProperty)
    expect(transition).toContain('transform')

    await next(page) // 9 slides from seat 3 to seat 4
    await expect.poll(async () => (await xAt()) - before, { timeout: 3000 }).toBeGreaterThan(20)
    // After it settles it has moved exactly one seat: the distance between two neighbouring seats.
    await page.waitForTimeout(700)
    const slot = page.locator('.seat-slot')
    const stride = (await slot.nth(1).boundingBox())!.x - (await slot.nth(0).boundingBox())!.x
    expect(Math.abs((await xAt()) - before - stride)).toBeLessThanOrEqual(1.5)
  })

  test('with predict mode on, it asks how many elements will move, and the answers are 0, 4, 0 and 3', async ({ page }) => {
    await page.getByRole('switch', { name: 'Predict mode' }).check()
    const ask = (operation: string, answer: string) => async () => {
      await page.keyboard.press('ArrowRight')
      await expect(page.getByRole('heading', { name: `How many elements will move when we ${operation}?` })).toBeVisible()
      await page.getByRole('group', { name: new RegExp(`${operation}\\?`) }).getByRole('button', { name: answer, exact: true }).click()
      await expect(page.getByText('Right!')).toBeVisible()
    }
    await ask('push', '0')()
    await ask('unshift', '4')() // moves on to the first slide
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight') // the rest of unshift
    await ask('pop', '0')()
    await ask('shift', '3')()
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight')
    await expect(stepText(page)).toHaveText('Step 13 of 13')
    await expect(page.getByText('You predicted 4 of 4.')).toBeVisible()
  })

  test('a wrong guess is explained in terms of seats', async ({ page }) => {
    await page.getByRole('switch', { name: 'Predict mode' }).check()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight') // the second question, about unshift
    // Step 1 answered by key 1 (push: 0 is first), then ask about unshift
    await expect(page.getByRole('heading', { name: 'How many elements will move when we push?' })).toBeVisible()
    await page.getByRole('group', { name: /push\?/ }).getByRole('button', { name: '1', exact: true }).click()
    await expect(page.getByText('Not quite. The answer was 0.')).toBeVisible()
    await expect(page.getByText(/push adds at the end, where there is already a free seat/)).toBeVisible()
  })

  test('your own starting array changes the run: 2 numbers give 11 steps, an empty one gives 7', async ({ page }) => {
    await field(page).fill('4, 6')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 11')
    expect(await labels(page)).toEqual(['Seat 0: 4', 'Seat 1: 6'])

    await field(page).fill('')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(stepText(page)).toHaveText('Step 1 of 7')
    expect(await labels(page)).toEqual([])
    await page.getByRole('heading', { level: 1 }).click()
    await next(page, 6)
    await expect(page.getByRole('status')).toHaveText('Return the array: [].')
  })

  test('refuses more than six numbers, saying why', async ({ page }) => {
    await field(page).fill('1 2 3 4 5 6 7')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(page.getByText('Use at most 6 numbers (you entered 7).')).toBeVisible()
    await expect(stepText(page)).toHaveText('Step 1 of 13')
  })

  test('the quiz completes the topic and earns stars', async ({ page }) => {
    const answers: [string, string][] = [
      ['Which of these has to move every other element in the array?', 'unshift'],
      ['What happens to the other elements when you call pop()?', 'Nothing moves'],
      ['On an array with 1,000 elements, which call does the most work?', 'shift()'],
    ]
    for (const [question, option] of answers) {
      await page.getByRole('group', { name: question }).getByRole('radio', { name: option, exact: true }).check()
    }
    await page.getByRole('button', { name: 'Check answers' }).click()
    await expect(page.getByText('You got 3 of 3.')).toBeVisible()
    await page.getByRole('link', { name: /back to the map/i }).click()
    const stage = page.getByRole('listitem', { name: 'Array basics' })
    await expect(stage).toContainText('Completed')
    await expect(stage.getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
  })

  test('with reduced motion the boxes still end in the right seats, with no transition', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await next(page, 2)
    const box = page.getByRole('listitem', { name: /: 9$/ })
    expect(await box.evaluate((el) => getComputedStyle(el).transitionDuration)).toMatch(/^0s(, 0s)*$/)
    expect(await labels(page)).toEqual(['Seat 0: 3', 'Seat 1: 5', 'Seat 2: 8', 'Seat 4: 9'])
  })

  test('six numbers need eight seats, and they still fit the screen with no sideways scrolling', async ({ page }) => {
    await field(page).fill('11 22 33 44 55 66')
    await page.getByRole('button', { name: 'Apply' }).click()
    await page.getByRole('heading', { level: 1 }).click()
    await next(page, 2) // push and the first slide: eight seats are now needed
    const viewport = page.viewportSize()!
    for (const seat of await seats(page).all()) {
      const box = (await seat.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
      expect(box.width).toBeGreaterThanOrEqual(30)
    }
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(overflows).toBe(false)
  })
})

test.describe('help on this topic', () => {
  test('a first visit shows the tour here too, with the Predict and own-array steps', async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        'stepwise:v1',
        JSON.stringify({ version: 1, completed: { 'sum-demo': { stars: 1 } }, unlockAll: false, runs: {}, settings: { language: 'js', speed: 1, predictMode: false }, streak: { current: 0, longest: 0, lastStudyDay: null, freezeUsedWeek: null }, badges: {}, help: { tourSeen: false } }),
      ),
    )
    await page.goto(TOPIC)
    await expect(page.getByRole('dialog', { name: 'The picture' })).toBeVisible()
    await expect(page.getByText('Step 1 of 5')).toBeVisible()
  })
})
