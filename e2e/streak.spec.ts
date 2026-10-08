import { expect, test, type Page } from '@playwright/test'
import { finishRun, hud, setDay } from './helpers'

/** Pretend it is `day`, come back to the app, and finish a run. */
async function studyOn(page: Page, day: string) {
  await setDay(page, day)
  await finishRun(page)
}

async function statsOnMap(page: Page) {
  await page.goto('/')
  const panel = page.getByRole('region', { name: 'Streak' })
  await expect(panel).toBeVisible()
  return panel
}

const stat = (panel: ReturnType<Page['getByRole']>, name: string) =>
  panel.locator('div', { has: panel.page().getByText(name, { exact: true }) }).locator('dd')

test('studying on consecutive days grows the streak', async ({ page }) => {
  await studyOn(page, '2026-10-08') // Thursday
  await expect(hud(page).getByText('1-day streak')).toBeVisible()

  await setDay(page, '2026-10-09')
  await page.reload()
  await expect(hud(page).getByText('1-day streak')).toBeVisible() // still alive, just not studied yet today

  await studyOn(page, '2026-10-09')
  await expect(hud(page).getByText('2-day streak')).toBeVisible()

  const panel = await statsOnMap(page)
  await expect(stat(panel, 'Current streak')).toHaveText('2 days')
  await expect(stat(panel, 'Best streak')).toHaveText('2 days')
})

test('studying twice in one day counts once', async ({ page }) => {
  await studyOn(page, '2026-10-08')
  await studyOn(page, '2026-10-08')
  await expect(hud(page).getByText('1-day streak')).toBeVisible()
})

test('one missed day is forgiven by the weekly freeze', async ({ page }) => {
  await studyOn(page, '2026-10-08') // Thursday
  const before = await statsOnMap(page)
  await expect(stat(before, 'Weekly freeze')).toHaveText('Ready')

  await studyOn(page, '2026-10-10') // Saturday, Friday missed
  await expect(hud(page).getByText('2-day streak')).toBeVisible()
  const after = await statsOnMap(page)
  await expect(stat(after, 'Weekly freeze')).toHaveText('Used this week')
})

test('a second missed day in the same week breaks the streak, but the best streak is kept', async ({ page }) => {
  await studyOn(page, '2026-10-06') // Tuesday
  await studyOn(page, '2026-10-08') // Thursday: Wednesday forgiven
  await expect(hud(page).getByText('2-day streak')).toBeVisible()

  await studyOn(page, '2026-10-10') // Saturday: Friday missed, freeze already used this week
  await expect(hud(page).getByText('1-day streak')).toBeVisible()
  const panel = await statsOnMap(page)
  await expect(stat(panel, 'Best streak')).toHaveText('2 days')
})

test('the freeze belongs to the week of the missed day, not the day you come back', async ({ page }) => {
  await studyOn(page, '2026-10-12') // Monday
  await studyOn(page, '2026-10-14') // Wednesday: Tuesday forgiven
  await expect(hud(page).getByText('2-day streak')).toBeVisible()
  await studyOn(page, '2026-10-15') // Thursday
  await studyOn(page, '2026-10-17') // Saturday: Friday missed, freeze already used this week
  await expect(hud(page).getByText('1-day streak')).toBeVisible()

  await studyOn(page, '2026-10-19') // next Monday: Sunday missed, belongs to the old week's freeze
  await expect(hud(page).getByText('1-day streak')).toBeVisible() // freeze was used, so reset
})

test('each new week brings a fresh freeze', async ({ page }) => {
  // Mon Oct 5 .. Wed Oct 7, then Thu Oct 8 is missed (freeze for the week of Oct 5)
  for (const day of ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12']) {
    await studyOn(page, day)
  }
  await expect(hud(page).getByText('7-day streak')).toBeVisible()
  // Tue Oct 13 is missed, but it is a new week with its own freeze, so the streak lives on.
  await studyOn(page, '2026-10-14')
  await expect(hud(page).getByText('8-day streak')).toBeVisible()
})

test('two missed days end the streak, and the header says to start again', async ({ page }) => {
  await studyOn(page, '2026-10-08')
  await setDay(page, '2026-10-12')
  await page.reload()
  await expect(hud(page).getByText('Start a streak')).toBeVisible()
  const panel = await statsOnMap(page)
  await expect(stat(panel, 'Current streak')).toHaveText('0 days')
  await expect(stat(panel, 'Best streak')).toHaveText('1 day')
})
