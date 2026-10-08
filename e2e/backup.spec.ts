import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { closeYourData, dataModal, finishRun, hud, openYourData, passQuiz, setDay } from './helpers'

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

const warmUp = (page: Page) => page.getByRole('listitem', { name: 'Warm-up: Add up the numbers' })
const textbox = (page: Page) => page.getByRole('textbox', { name: 'Or paste your backup' })
const review = (page: Page) => page.getByRole('group', { name: 'Review backup' })

/** Builds some progress: a finished run, TypeScript, speed 3 and a perfect quiz. */
async function buildProgress(page: Page) {
  await finishRun(page)
  await page.getByRole('button', { name: 'TS' }).click()
  await page.getByRole('slider', { name: 'Speed' }).fill('3')
  await passQuiz(page)
  await expect(page.getByText('You got 3 of 3.')).toBeVisible()
  await page.goto('/#/')
  await expect(warmUp(page).getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
}

/** Like opening the app in a brand-new browser. */
async function wipeBrowser(page: Page) {
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(hud(page).getByText('Start a streak')).toBeVisible()
  await expect(warmUp(page)).not.toContainText('Completed')
}

async function expectRestored(page: Page) {
  await expect(page.getByText('Progress restored.')).toBeVisible()
  await closeYourData(page)
  await expect(warmUp(page)).toContainText('Completed')
  await expect(warmUp(page).getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
  await expect(hud(page).getByText('1-day streak')).toBeVisible()
  await expect(hud(page).getByRole('link', { name: '3 of 9 badges' })).toBeVisible()
  await warmUp(page).getByRole('link').click()
  await expect(page.getByRole('button', { name: 'TS' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('slider', { name: 'Speed' })).toHaveValue('3')
}

test.beforeEach(async ({ page }) => {
  await setDay(page, '2026-10-08')
})

test('copy the backup, wipe the browser, paste it back: everything returns', async ({ page }) => {
  await buildProgress(page)
  await openYourData(page)
  await page.getByRole('button', { name: 'Copy backup' }).click()
  await expect(page.getByText('Backup copied.')).toBeVisible()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).not.toContain('\n')
  expect(JSON.parse(copied)).toMatchObject({ app: 'stepwise', format: 1 })

  await wipeBrowser(page)
  await openYourData(page)
  await textbox(page).fill(copied)
  await page.getByRole('button', { name: 'Review backup' }).click()
  await expect(review(page)).toContainText('This backup was saved Oct 8, 2026.')
  await expect(review(page)).toContainText('It has 1 topic completed, a best streak of 1 day and 3 badges.')
  await expect(review(page)).toContainText('Right now you have 0 topics completed, a best streak of 0 days and 0 badges.')
  await expect(review(page).getByRole('button', { name: 'Cancel' })).toBeFocused()

  await review(page).getByRole('button', { name: 'Replace my progress' }).click()
  await expectRestored(page)
})

test('download the file, wipe the browser, upload it: everything returns', async ({ page }, testInfo) => {
  await buildProgress(page)
  await openYourData(page)
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download backup' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('stepwise-progress-2026-10-08.json')
  const saved = testInfo.outputPath('backup.json')
  await download.saveAs(saved)
  const text = readFileSync(saved, 'utf8')
  expect(text).toContain('\n  "app": "stepwise"') // the file is readable
  expect(JSON.parse(text).data.completed['sum-demo'].stars).toBe(3)

  await wipeBrowser(page)
  await openYourData(page)
  await page.getByLabel('Choose backup file').setInputFiles(saved)
  await expect(review(page)).toContainText('It has 1 topic completed')
  await review(page).getByRole('button', { name: 'Replace my progress' }).click()
  await expectRestored(page)
})

test('cancelling the review, with the button or Escape, changes nothing', async ({ page }) => {
  await buildProgress(page)
  await openYourData(page)
  await page.getByRole('button', { name: 'Copy backup' }).click()
  const copied = await page.evaluate(() => navigator.clipboard.readText())

  await textbox(page).fill(copied)
  await page.getByRole('button', { name: 'Review backup' }).click()
  await review(page).getByRole('button', { name: 'Cancel' }).click()
  await expect(review(page)).toHaveCount(0)
  await expect(page.getByText('Progress restored.')).toHaveCount(0)

  await page.getByRole('button', { name: 'Review backup' }).click()
  await expect(review(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(review(page)).toHaveCount(0)
  await expect(dataModal(page)).toBeVisible() // Escape closed only the review

  await closeYourData(page)
  await expect(warmUp(page)).toContainText('Completed')
  await expect(hud(page).getByRole('link', { name: '3 of 9 badges' })).toBeVisible()
})

test('bad input shows a plain message and changes nothing', async ({ page }) => {
  await buildProgress(page)
  await openYourData(page)
  const tryText = async (text: string, message: RegExp) => {
    await textbox(page).fill(text)
    await page.getByRole('button', { name: 'Review backup' }).click()
    await expect(page.getByText(message)).toBeVisible()
    await expect(review(page)).toHaveCount(0)
  }

  await page.getByRole('button', { name: 'Review backup' }).click()
  await expect(page.getByText('Paste a backup or choose a file first.')).toBeVisible()

  await tryText('this is not json', /isn.t a readable backup/)
  await tryText('{"hello":"world"}', /doesn.t look like a Stepwise backup/)
  await tryText('{"app":"stepwise","format":2,"data":{}}', /newer version of Stepwise/)
  await tryText('{"app":"stepwise","format":1,"data":{"version":1,"completed":5}}', /damaged or incomplete/)
  await closeYourData(page)
  await expect(warmUp(page)).toContainText('Completed')
  await expect(hud(page).getByRole('link', { name: '3 of 9 badges' })).toBeVisible()
})

test('a file that is not a backup is rejected', async ({ page }) => {
  await page.goto('/')
  await openYourData(page)
  await page.getByLabel('Choose backup file').setInputFiles({
    name: 'notes.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"shopping":["milk","eggs"]}'),
  })
  await expect(page.getByText(/doesn.t look like a Stepwise backup/)).toBeVisible()
  await expect(review(page)).toHaveCount(0)
})

test('when the browser blocks copying, the backup text is shown, selected', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('blocked')) },
      configurable: true,
    })
  })
  await buildProgress(page)
  await openYourData(page)
  await page.getByRole('button', { name: 'Copy backup' }).click()
  await expect(page.getByText(/couldn.t copy automatically/i)).toBeVisible()
  const box = page.getByRole('textbox', { name: 'Backup text to copy by hand' })
  await expect(box).toBeFocused()
  expect(JSON.parse(await box.inputValue())).toMatchObject({ app: 'stepwise' })
  const selectedAll = await box.evaluate((el: HTMLTextAreaElement) => el.selectionEnd - el.selectionStart === el.value.length)
  expect(selectedAll).toBe(true)
})

test('keyboard only: paste, review, replace', async ({ page }) => {
  await buildProgress(page)
  await openYourData(page)
  await page.getByRole('button', { name: 'Copy backup' }).click()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  await wipeBrowser(page)
  await openYourData(page)

  await textbox(page).focus()
  await page.keyboard.insertText(copied)
  await page.keyboard.press('Tab') // to Review backup
  await page.keyboard.press('Enter')
  await expect(review(page).getByRole('button', { name: 'Cancel' })).toBeFocused()
  await page.keyboard.press('Shift+Tab') // to Replace my progress
  await page.keyboard.press('Enter')
  await expectRestored(page)
})

test('the modal has no sideways scrolling, even with the review and fallback open', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('blocked')) },
      configurable: true,
    })
  })
  await buildProgress(page)
  await openYourData(page)
  await page.getByRole('button', { name: 'Copy backup' }).click()
  const text = await page.getByRole('textbox', { name: 'Backup text to copy by hand' }).inputValue()
  await textbox(page).fill(text)
  await page.getByRole('button', { name: 'Review backup' }).click()
  await expect(review(page)).toBeVisible()
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflows).toBe(false)
})
