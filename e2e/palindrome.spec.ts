import { expect, test, type Page } from '@playwright/test'

const TOPIC = '/#/topic/palindrome'
const stepText = (page: Page) => page.locator('.controls-step')
const narration = (page: Page) => page.getByRole('status')
const field = (page: Page) => page.getByRole('textbox', { name: 'Word' })
const variable = (page: Page, name: string) =>
  page
    .getByRole('region', { name: 'Variables' })
    .locator('.variable')
    .filter({ has: page.locator('dt', { hasText: new RegExp(`^${name}$`) }) })
    .locator('dd')
const highlighted = (page: Page) => page.locator('.code-panel [aria-current="step"]')
const boxes = (page: Page) => page.getByRole('list', { name: 'Array' }).getByRole('listitem')
const letters = (page: Page) => page.getByRole('list', { name: 'Array' }).locator('.box-value')

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
async function apply(page: Page, word: string) {
  await field(page).fill(word)
  await page.getByRole('button', { name: 'Apply' }).click()
}

test.describe('unlocking', () => {
  const upToDuplicateCheck = {
    'sum-demo': { stars: 3 },
    'array-basics': { stars: 3 },
    'map-filter-reduce': { stars: 3 },
    'hidden-loops': { stars: 3 },
    'has-duplicate': { stars: 3 },
  }

  test.describe('before Two pointers is done', () => {
    test.use({ storageState: stored(state(upToDuplicateCheck)) })

    test('is locked, and says so', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('listitem', { name: 'Palindrome' })).toContainText(
        'Locked. Finish Two pointers to unlock.',
      )
      await page.goto(TOPIC)
      await expect(page.getByRole('heading', { level: 1, name: 'Locked' })).toBeVisible()
    })
  })

  test.describe('after it', () => {
    test.use({ storageState: stored(state({ ...upToDuplicateCheck, 'two-pointers': { stars: 3 } })) })

    test('opens from the map as next up, right after Two pointers', async ({ page }) => {
      await page.goto('/')
      const titles = await page.getByRole('listitem').getByRole('heading').allTextContents()
      expect(titles.indexOf('Palindrome')).toBe(titles.indexOf('Two pointers') + 1)
      const stage = page.getByRole('listitem', { name: 'Palindrome' })
      await expect(stage.getByText('Next up')).toBeVisible()
      await stage.getByRole('link').click()
      await expect(page.getByRole('heading', { level: 1, name: 'Palindrome' })).toBeVisible()
      await expect(stepText(page)).toHaveText('Step 1 of 11')
    })

    test('Binary search now waits for Palindrome', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('listitem', { name: 'Binary search' })).toContainText(
        'Locked. Finish Palindrome to unlock.',
      )
    })
  })
})

test.describe('the walkthrough', () => {
  test.use({ storageState: stored(state({}, true)) })

  test.beforeEach(async ({ page }) => {
    await page.goto(TOPIC)
    await expect(stepText(page)).toHaveText('Step 1 of 11')
    await page.getByRole('heading', { level: 1 }).click() // so the shortcuts work
  })

  test('has the topic page sections, the two-readers analogy and its source', async ({ page }) => {
    await expect(page.getByText('Two people reading the same word')).toBeVisible()
    await expect(page.getByText('Where the analogy breaks:')).toBeVisible()
    await expect(page.getByText('Time O(n) because')).toBeVisible()
    await expect(page.getByText('Space O(1) because')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Tech Interview Handbook: Strings (Palindrome)' })).toHaveAttribute(
      'target',
      '_blank',
    )
    await expect(page.getByText('Watch first')).toHaveCount(0)
  })

  test('shows racecar as one box per character, with no pointers yet, then front and back at the two ends', async ({ page }) => {
    await expect(letters(page)).toHaveText(['r', 'a', 'c', 'e', 'c', 'a', 'r'])
    await expect(page.locator('[data-pointer]')).toHaveCount(0)
    await expect(narration(page)).toHaveText('Call isPalindrome with "racecar". We will compare characters from both ends.')
    await press(page, 1)
    await expect(highlighted(page)).toContainText('let front = 0')
    await expect(boxes(page).nth(0)).toContainText('front')
    await press(page, 1)
    await expect(highlighted(page)).toContainText('let back = str.length - 1')
    await expect(boxes(page).nth(6)).toContainText('back')
    await expect(variable(page, 'back')).toHaveText('6')
  })

  test('a compare step marks the pair, and a match settles it in green and moves both pointers in', async ({ page }) => {
    await press(page, 3)
    await expect(narration(page)).toHaveText(
      'Compare "r" at front with "r" at back: a palindrome needs the two ends to be equal.',
    )
    await expect(highlighted(page)).toContainText('if (str[front] !== str[back]) {')
    await expect(boxes(page).nth(0)).toHaveAttribute('data-mark', 'current')
    await expect(boxes(page).nth(6)).toHaveAttribute('data-mark', 'compare')
    await expect(variable(page, 'comparisons')).toHaveText('1')
    await press(page, 1)
    await expect(narration(page)).toHaveText(
      '"r" and "r" match, so this pair is settled: move front one step right and back one step left.',
    )
    await expect(highlighted(page)).toContainText('front++')
    await expect(boxes(page).nth(0)).toHaveAttribute('data-mark', 'done')
    await expect(boxes(page).nth(6)).toHaveAttribute('data-mark', 'done')
    await expect(boxes(page).nth(1)).toContainText('front')
    await expect(boxes(page).nth(5)).toContainText('back')
    await expect(variable(page, 'front')).toHaveText('1')
    await expect(variable(page, 'back')).toHaveText('5')
  })

  test('the middle character is never compared: both pointers land on it and the loop stops', async ({ page }) => {
    await press(page, 8)
    await expect(boxes(page).nth(3)).toContainText('front')
    await expect(boxes(page).nth(3)).toContainText('back')
    await expect(variable(page, 'comparisons')).toHaveText('3')
    await press(page, 1)
    await expect(stepText(page)).toHaveText('Step 10 of 11')
    await expect(highlighted(page)).toContainText('while (front < back) {')
    await expect(narration(page)).toHaveText(
      'front and back are both on "e", the middle character: it has no partner to compare with, so the loop stops.',
    )
    await expect(boxes(page).nth(3)).toHaveAttribute('data-mark', 'done')
  })

  test('a palindrome ends with every character green and return true', async ({ page }) => {
    await press(page, 10)
    await expect(stepText(page)).toHaveText('Step 11 of 11')
    await expect(highlighted(page)).toContainText('return true')
    await expect(narration(page)).toHaveText(
      'The pointers met in the middle, so every pair matched: return true. That took 3 comparisons for 7 characters.',
    )
    for (let i = 0; i < 7; i++) await expect(boxes(page).nth(i)).toHaveAttribute('data-mark', 'done')
    await expect(variable(page, 'result')).toHaveText('true')
    await expect(page.getByText('Run complete')).toBeVisible()
  })

  test('a word that is not a palindrome stops at the mismatch, in red, without finishing the loop', async ({ page }) => {
    await apply(page, 'abcdefa')
    await expect(stepText(page)).toHaveText('Step 1 of 7')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 5)
    await expect(narration(page)).toHaveText(
      'Compare "b" at front with "f" at back: a palindrome needs the two ends to be equal.',
    )
    await press(page, 1)
    await expect(stepText(page)).toHaveText('Step 7 of 7')
    await expect(highlighted(page)).toContainText('return false')
    await expect(narration(page)).toHaveText(
      '"b" and "f" are different, so the word is not a palindrome: return false at once. That took 2 comparisons, and the 3 characters in between were never looked at.',
    )
    await expect(boxes(page).nth(1)).toHaveAttribute('data-mark', 'mismatch')
    await expect(boxes(page).nth(5)).toHaveAttribute('data-mark', 'mismatch')
    await expect(boxes(page).nth(1)).toContainText('does not match')
    await expect(boxes(page).nth(0)).toHaveAttribute('data-mark', 'done')
    await expect(boxes(page).nth(3)).not.toHaveAttribute('data-mark', /.+/) // never looked at
    await expect(variable(page, 'result')).toHaveText('false')
    await expect(variable(page, 'comparisons')).toHaveText('2')
    await expect(page.getByText('Run complete')).toBeVisible()
  })

  test('a mismatch on the very first pair ends after one comparison', async ({ page }) => {
    await apply(page, 'ab')
    await expect(stepText(page)).toHaveText('Step 1 of 5')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 4)
    await expect(narration(page)).toHaveText(
      '"a" and "b" are different, so the word is not a palindrome: return false at once. That took 1 comparison.',
    )
  })

  test('an even word has no middle: the pointers cross', async ({ page }) => {
    await apply(page, 'abba')
    await expect(stepText(page)).toHaveText('Step 1 of 9')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 7)
    await expect(narration(page)).toHaveText(
      'front (2) has gone past back (1): every pair has been compared, so the loop stops.',
    )
  })

  test('an empty word and a single character are palindromes with nothing to compare', async ({ page }) => {
    await apply(page, '')
    await expect(stepText(page)).toHaveText('Step 1 of 5')
    await page.getByRole('heading', { level: 1 }).click()
    await expect(page.getByText('Empty array')).toBeVisible()
    await press(page, 4)
    await expect(narration(page)).toHaveText('An empty word reads the same both ways: return true.')
    await expect(variable(page, 'result')).toHaveText('true')

    await apply(page, 'a')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 4)
    await expect(narration(page)).toHaveText('A single character reads the same both ways: return true.')
  })

  test('with predict mode on it asks how many comparisons, then what happens after each one', async ({ page }) => {
    await page.getByRole('switch', { name: 'Predict mode' }).check()
    await page.getByRole('heading', { level: 1 }).click()
    const answerNext = async (question: string, answer: string) => {
      for (let i = 0; i < 12; i++) {
        if (await page.getByRole('heading', { name: question }).isVisible()) break
        await page.keyboard.press('ArrowRight')
      }
      await expect(page.getByRole('heading', { name: question })).toBeVisible()
      await page.getByRole('group', { name: question }).getByRole('button', { name: answer, exact: true }).click()
      await expect(page.getByText('Right!')).toBeVisible()
    }
    await answerNext('How many comparisons will "racecar" need before it can answer?', '3')
    await answerNext('front is "r" and back is "r". What happens next?', 'Keep going')
    await answerNext('front is "a" and back is "a". What happens next?', 'Keep going')
    await answerNext('front is "c" and back is "c". What happens next?', 'Keep going')
    await expect(stepText(page)).toHaveText('Step 9 of 11')
    await press(page, 2)
    await expect(stepText(page)).toHaveText('Step 11 of 11')
    await expect(page.getByText('You predicted 4 of 4.')).toBeVisible()
  })

  test('a wrong prediction is explained and the run carries on', async ({ page }) => {
    await apply(page, 'abca')
    await page.getByRole('switch', { name: 'Predict mode' }).check()
    await page.getByRole('heading', { level: 1 }).click()
    for (let i = 0; i < 4; i++) {
      if (await page.getByRole('heading', { name: /How many comparisons/ }).isVisible()) break
      await page.keyboard.press('ArrowRight')
    }
    const count = page.getByRole('group', { name: 'How many comparisons will "abca" need before it can answer?' })
    await expect(count).toBeVisible()
    await count.getByRole('button', { name: '4', exact: true }).click()
    await expect(page.getByText('Not quite')).toBeVisible()
    await expect(page.getByText('It stops at the first pair that differs, after 2 comparisons.')).toBeVisible()
  })

  test('refuses bad input with a message that says what to fix, and keeps the run going', async ({ page }) => {
    await press(page, 4)
    await expect(stepText(page)).toHaveText('Step 5 of 11')
    const refuse = async (text: string, message: string) => {
      await field(page).fill(text)
      await page.getByRole('button', { name: 'Apply' }).click()
      await expect(page.getByText(message)).toBeVisible()
      await expect(stepText(page)).toHaveText('Step 5 of 11') // the run in progress is untouched
    }
    await refuse('race car', 'Letters and digits only: leave out the space.')
    await refuse('noon!', 'Letters and digits only: leave out the "!".')
    await refuse('a,b', 'Letters and digits only: leave out the ",".')
    await refuse('été', 'Letters and digits only: "é" is outside A to Z and 0 to 9.')
    await refuse('abcdefghijklm', 'Use at most 12 characters (you entered 13).')
    await refuse('a'.repeat(300), 'That is too long. Use up to 12 characters.')
  })

  test('says that capitals are read as lowercase, and does so', async ({ page }) => {
    await expect(page.getByText('Capitals are read as lowercase.')).toBeVisible()
    await apply(page, 'RaCeCaR')
    await expect(field(page)).toHaveValue('racecar')
    await expect(letters(page)).toHaveText(['r', 'a', 'c', 'e', 'c', 'a', 'r'])
    await expect(stepText(page)).toHaveText('Step 1 of 11')
  })

  test('digits work too', async ({ page }) => {
    await apply(page, '12321')
    await expect(letters(page)).toHaveText(['1', '2', '3', '2', '1'])
  })

  test('Random makes a word and the run starts again', async ({ page }) => {
    await page.getByRole('button', { name: 'Random' }).click()
    await expect(stepText(page)).toHaveText(/^Step 1 of \d+$/)
    await expect(field(page)).toHaveValue(/^[a-z]{3,9}$/)
  })

  test('the quiz completes the topic and earns stars', async ({ page }) => {
    const answers: [string, string][] = [
      ['The two ends do not match. What does the code do?', 'Return false at once'],
      ['What happens to the middle letter of an odd word?', 'It is never compared'],
      ['Why does this take O(n) time?', 'It reads half the letters'],
      ['How much extra memory does it need?', 'Just two pointers'],
    ]
    for (const [question, option] of answers) {
      await page.getByRole('group', { name: question }).getByRole('radio', { name: option, exact: true }).check()
    }
    await page.getByRole('button', { name: 'Check answers' }).click()
    await expect(page.getByText('You got 4 of 4.')).toBeVisible()
    await page.getByRole('link', { name: /back to the map/i }).click()
    const stage = page.getByRole('listitem', { name: 'Palindrome' })
    await expect(stage).toContainText('Completed')
    await expect(stage.getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
  })

  test('twelve characters with their pointer tags fit a phone with no sideways scrolling', async ({ page }) => {
    await apply(page, 'abcdefghijkl')
    await expect(stepText(page)).toHaveText('Step 1 of 5')
    await page.getByRole('heading', { level: 1 }).click()
    await press(page, 4)
    await expect(boxes(page)).toHaveCount(12)
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
    const layout = () => boxes(page).nth(1).evaluate((el) => [el.offsetTop, el.offsetHeight])
    const before = await layout()
    await press(page, 2) // after the first match, front lands on the second box
    await expect(boxes(page).nth(1)).toContainText('front')
    expect(await layout()).toEqual(before)
  })
})
