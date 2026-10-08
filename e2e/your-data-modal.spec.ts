import { expect, test, type Page } from '@playwright/test'
import { closeYourData, dataModal, openYourData, yourDataButton } from './helpers'

/**
 * Where keyboard focus is: inside the modal, or on the browser's own UI (reported as BODY, which a
 * native modal allows after its last control). Never on the page behind.
 */
const focusPlace = (page: Page) =>
  page.evaluate(() => {
    const active = document.activeElement
    if (document.querySelector('dialog')?.contains(active)) return `modal:${active?.textContent?.trim() ?? ''}`
    return active === document.body ? 'browser' : `PAGE BEHIND: ${active?.tagName}`
  })

test('the map no longer carries the backup and reset tools', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Your path' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reset progress' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Download backup' })).toHaveCount(0)
  await expect(yourDataButton(page)).toBeVisible()
})

test('opens from the map and from a topic page, with all the tools and focus on the title', async ({ page }) => {
  for (const url of ['/', '/#/topic/sum-demo']) {
    await page.goto(url)
    await openYourData(page)
    const modal = dataModal(page)
    await expect(modal.getByRole('heading', { level: 2, name: 'Your data' })).toBeFocused()
    await expect(modal.getByText(/saved in this browser only/i)).toBeVisible()
    await expect(modal.getByRole('button', { name: 'Download backup' })).toBeVisible()
    await expect(modal.getByRole('button', { name: 'Copy backup' })).toBeVisible()
    await expect(modal.getByLabel('Choose backup file')).toBeAttached()
    await expect(modal.getByRole('button', { name: 'Reset progress' })).toBeVisible()
    await closeYourData(page)
  }
})

test('closes with the Close button, Escape or a click on the dimmed area, and focus returns to the chip', async ({
  page,
}) => {
  await page.goto('/')

  await openYourData(page)
  await dataModal(page).getByRole('button', { name: 'Close' }).click()
  await expect(dataModal(page)).toHaveCount(0)
  await expect(yourDataButton(page)).toBeFocused()

  await openYourData(page)
  await page.keyboard.press('Escape')
  await expect(dataModal(page)).toHaveCount(0)
  await expect(yourDataButton(page)).toBeFocused()

  await openYourData(page)
  await page.mouse.click(4, 4) // the dimmed area, far from the centered window
  await expect(dataModal(page)).toHaveCount(0)
  await expect(yourDataButton(page)).toBeFocused()
})

test('keyboard only: Enter on the chip opens it, Escape closes it', async ({ page }) => {
  await page.goto('/')
  await yourDataButton(page).focus()
  await page.keyboard.press('Enter')
  await expect(dataModal(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dataModal(page)).toHaveCount(0)
  await expect(yourDataButton(page)).toBeFocused()
})

test('focus cannot leave the modal, and the page behind is out of reach and does not scroll', async ({ page }) => {
  await page.goto('/')
  await openYourData(page)

  const visited: string[] = []
  for (let i = 0; i < 18; i++) {
    await page.keyboard.press('Tab')
    visited.push(await focusPlace(page))
  }
  for (let i = 0; i < 18; i++) {
    await page.keyboard.press('Shift+Tab')
    visited.push(await focusPlace(page))
  }
  expect(visited.filter((place) => place.startsWith('PAGE BEHIND'))).toEqual([])
  // It really cycles through the modal's controls, and wraps round to the Close button again.
  expect(visited.filter((place) => place === 'modal:×Close').length).toBeGreaterThanOrEqual(2)
  expect(visited).toContain('modal:Reset progress')

  // The page behind cannot be clicked: the dimmed backdrop takes the pointer.
  await expect(
    page.getByRole('link', { name: /Warm-up/ }).click({ trial: true, timeout: 1500 }),
  ).rejects.toThrow(/intercepts pointer events/)
  await expect(
    yourDataButton(page).locator('..').getByRole('link', { name: /badges/ }).click({ trial: true, timeout: 1500 }),
  ).rejects.toThrow(/intercepts pointer events/)
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden')

  await closeYourData(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Your path' })).toBeVisible()
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden')
})

test('Escape closes a nested step first, and the modal only on the second press', async ({ page }) => {
  await page.goto('/')
  await openYourData(page)
  await dataModal(page).getByRole('button', { name: 'Reset progress' }).click()
  const confirm = page.getByRole('group', { name: 'Confirm reset' })
  await expect(confirm).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(confirm).toHaveCount(0)
  await expect(dataModal(page)).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dataModal(page)).toHaveCount(0)
})

test('reopening starts clean', async ({ page }) => {
  await page.goto('/')
  await openYourData(page)
  await dataModal(page).getByRole('button', { name: 'Review backup' }).click()
  await expect(page.getByText('Paste a backup or choose a file first.')).toBeVisible()
  await closeYourData(page)

  await openYourData(page)
  await expect(page.getByText('Paste a backup or choose a file first.')).toHaveCount(0)
})

test('the modal fits the screen without sideways scrolling', async ({ page }) => {
  await page.goto('/')
  await openYourData(page)
  const viewport = page.viewportSize()!
  const box = (await dataModal(page).boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflows).toBe(false)
})

test('the content scrolls inside the modal when the screen is short', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 420 })
  await page.goto('/')
  await openYourData(page)
  const body = dataModal(page).locator('.modal-body')
  expect(await body.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)
  await dataModal(page).getByRole('button', { name: 'Reset progress' }).scrollIntoViewIfNeeded()
  await expect(dataModal(page).getByRole('button', { name: 'Reset progress' })).toBeInViewport()
  // The close button stays reachable at the top.
  await expect(dataModal(page).getByRole('button', { name: 'Close' })).toBeInViewport()
})
