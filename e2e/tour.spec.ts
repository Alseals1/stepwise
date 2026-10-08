import { expect, test, type Page } from '@playwright/test'
import { closeYourData, openYourData } from './helpers'

// A brand-new visitor: nothing saved, so the tour has never been seen.
test.use({
  storageState: { cookies: [], origins: [] },
  permissions: ['clipboard-read', 'clipboard-write'],
})

const bubble = (page: Page) => page.getByRole('dialog', { name: /^(The picture|The code|The controls)$/ })
const spotlight = (page: Page) => page.locator('.tour-spotlight')
const TOPIC = '/#/topic/sum-demo'

async function box(locator: ReturnType<Page['locator']>) {
  const b = await locator.boundingBox()
  expect(b).not.toBeNull()
  return b!
}

/** The spotlight surrounds the target with 6px of padding, once its slide has settled (1px of rounding allowed). */
async function expectSpotlightAround(page: Page, target: string) {
  await expect
    .poll(async () => {
      const s = await box(spotlight(page))
      const t = await box(page.locator(`[data-tour="${target}"]`))
      const expected = [-6, -6, 12, 12]
      const actual = [s.x - t.x, s.y - t.y, s.width - t.width, s.height - t.height]
      return Math.max(...actual.map((value, i) => Math.abs(value - expected[i])))
    })
    .toBeLessThanOrEqual(1)
}

async function startTour(page: Page) {
  await page.goto(TOPIC)
  await expect(bubble(page)).toBeVisible()
}

test('the first topic visit starts the tour on the picture', async ({ page }) => {
  await startTour(page)
  await expect(page.getByRole('heading', { name: 'The picture' })).toBeFocused()
  await expect(page.getByText('Step 1 of 3')).toBeVisible()
  await expect(bubble(page)).toContainText('changes at every step')

  await expectSpotlightAround(page, 'picture')
})

test('the spotlight follows its target when the layout shifts by itself, for example when a font loads', async ({
  page,
}) => {
  await startTour(page)
  await expectSpotlightAround(page, 'picture')

  // Push the content down without any scrolling or resizing. (Scroll anchoring is switched off:
  // otherwise the browser compensates with a scroll event, which the tour already listens for.)
  await page.evaluate(() => {
    document.documentElement.style.overflowAnchor = 'none'
    document.body.style.overflowAnchor = 'none'
    const spacer = document.createElement('div')
    spacer.style.height = '40px'
    document.querySelector('main')!.prepend(spacer)
  })
  await expectSpotlightAround(page, 'picture')
})

test('the bubble is frosted glass: a blurred backdrop and a see-through background', async ({ page }) => {
  await startTour(page)
  const style = await bubble(page).evaluate((el) => {
    const css = getComputedStyle(el)
    return { backdrop: css.backdropFilter, background: css.backgroundColor }
  })
  expect(style.backdrop).toContain('blur(')
  // The background colour has an alpha below 1, written as "... / 0.78)" or "rgba(..., 0.78)".
  const alpha = /\/\s*([\d.]+)\s*\)|,\s*([\d.]+)\s*\)$/.exec(style.background)
  expect(alpha, `unexpected background: ${style.background}`).not.toBeNull()
  expect(Number(alpha![1] ?? alpha![2])).toBeLessThan(1)
  expect(Number(alpha![1] ?? alpha![2])).toBeGreaterThan(0.6)
})

test('Next, Back and Done walk through the three steps, and it never returns', async ({ page }) => {
  await startTour(page)
  await bubble(page).getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: 'The code' })).toBeFocused()
  await expect(page.getByText('Step 2 of 3')).toBeVisible()
  await bubble(page).getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: 'The controls' })).toBeVisible()
  await expect(bubble(page)).toContainText('Space plays or pauses')
  await bubble(page).getByRole('button', { name: 'Back' }).click()
  await expect(page.getByText('Step 2 of 3')).toBeVisible()
  await bubble(page).getByRole('button', { name: 'Next' }).click()
  await bubble(page).getByRole('button', { name: 'Done' }).click()
  await expect(bubble(page)).toHaveCount(0)
  await expect(spotlight(page)).toHaveCount(0)

  await page.reload()
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  await expect(bubble(page)).toHaveCount(0)
})

test('Skip tour ends it for good', async ({ page }) => {
  await startTour(page)
  await bubble(page).getByRole('button', { name: 'Skip tour' }).click()
  await expect(bubble(page)).toHaveCount(0)
  await page.reload()
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  await expect(bubble(page)).toHaveCount(0)
})

test('Escape ends it for good, even when focus is elsewhere', async ({ page }) => {
  await startTour(page)
  await page.getByRole('button', { name: 'Play' }).focus()
  await page.keyboard.press('Escape')
  await expect(bubble(page)).toHaveCount(0)
  await page.reload()
  await expect(bubble(page)).toHaveCount(0)
})

test('keyboard only: Tab and Enter get through the whole tour', async ({ page }) => {
  await startTour(page)
  const next = bubble(page).getByRole('button', { name: 'Next' })
  await page.keyboard.press('Tab') // Back is disabled on step 1, so Next is first
  await expect(next).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'The code' })).toBeFocused()

  await page.keyboard.press('Tab') // Back
  await page.keyboard.press('Tab') // Next
  await expect(next).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'The controls' })).toBeFocused()

  await page.keyboard.press('Tab') // Back
  await page.keyboard.press('Tab') // Done
  await expect(bubble(page).getByRole('button', { name: 'Done' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(bubble(page)).toHaveCount(0)
})

test('at every step the bubble is fully on screen and does not cover what it explains', async ({ page }) => {
  await startTour(page)
  const viewport = page.viewportSize()!
  for (const target of ['picture', 'code', 'controls']) {
    // Let the page scroll the target into view and the spotlight settle.
    await expect
      .poll(async () => {
        const t = await box(page.locator(`[data-tour="${target}"]`))
        return t.y + t.height > 0 && t.y < viewport.height
      })
      .toBe(true)
    await page.waitForTimeout(350)

    const b = await box(bubble(page))
    const t = await box(page.locator(`[data-tour="${target}"]`))
    expect(b.x).toBeGreaterThanOrEqual(0)
    expect(b.y).toBeGreaterThanOrEqual(0)
    expect(b.x + b.width).toBeLessThanOrEqual(viewport.width)
    expect(b.y + b.height).toBeLessThanOrEqual(viewport.height)

    const side = await bubble(page).getAttribute('data-side')
    if (side !== 'docked') {
      const overlaps = b.x < t.x + t.width && b.x + b.width > t.x && b.y < t.y + t.height && b.y + b.height > t.y
      expect(overlaps, `the bubble should not cover the ${target}`).toBe(false)
    }
    const next = bubble(page).getByRole('button', { name: /^(Next|Done)$/ })
    if ((await next.textContent()) === 'Next') await next.click()
  }
})

test('the arrow keys belong to the tour while it is open, and drive the player after', async ({ page }) => {
  await startTour(page)
  await page.keyboard.press('ArrowRight')
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  await bubble(page).getByRole('button', { name: 'Skip tour' }).click()
  await page.getByRole('heading', { level: 1 }).click()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByText('Step 2 of 9')).toBeVisible()
})

test('the page behind stays usable: the highlighted code switch can be clicked during the tour', async ({
  page,
}) => {
  await startTour(page)
  await bubble(page).getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: 'The code' })).toBeVisible()
  await page.getByRole('button', { name: 'TS' }).click()
  await expect(page.getByRole('button', { name: 'TS' })).toHaveAttribute('aria-pressed', 'true')
  await expect(bubble(page)).toBeVisible() // the tour carries on
})

test('leaving in the middle does not count: the tour comes back on the next visit', async ({ page }) => {
  await startTour(page)
  await page.getByRole('link', { name: /back to the map/i }).click({ force: true })
  await expect(page.getByRole('heading', { level: 1, name: 'Your path' })).toBeVisible()
  await expect(bubble(page)).toHaveCount(0)
  await page.getByRole('listitem', { name: 'Warm-up: Add up the numbers' }).getByRole('link').click()
  await expect(bubble(page)).toBeVisible()
})

test('the tour never starts on the map, the badges page or the How-to page', async ({ page }) => {
  for (const url of ['/', '/#/badges', '/#/how-to']) {
    await page.goto(url)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(bubble(page)).toHaveCount(0)
  }
})

test('a restored backup remembers that the tour was seen', async ({ page }) => {
  await startTour(page)
  await bubble(page).getByRole('button', { name: 'Skip tour' }).click()
  await page.goto('/')
  await openYourData(page)
  await page.getByRole('button', { name: 'Copy backup' }).click()
  const backup = await page.evaluate(() => navigator.clipboard.readText())
  expect(JSON.parse(backup).data.help).toEqual({ tourSeen: true })
  await closeYourData(page)

  // A different browser: the tour starts again...
  await page.evaluate(() => localStorage.clear())
  await page.goto(TOPIC)
  await page.reload()
  await expect(bubble(page)).toBeVisible()

  // ...until the backup is restored.
  await page.goto('/')
  await openYourData(page)
  await page.getByRole('textbox', { name: 'Or paste your backup' }).fill(backup)
  await page.getByRole('button', { name: 'Review backup' }).click()
  await page.getByRole('button', { name: 'Replace my progress' }).click()
  await closeYourData(page)
  await page.getByRole('listitem', { name: 'Warm-up: Add up the numbers' }).getByRole('link').click()
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  await expect(bubble(page)).toHaveCount(0)
})
