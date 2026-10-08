import { expect, type Page } from '@playwright/test'

/** Pretend it is 10:00 local time on this day ("YYYY-MM-DD"). */
export const setDay = (page: Page, day: string) => page.clock.setFixedTime(new Date(`${day}T10:00:00`))

/** Opens the warm-up and steps to its last step with the keyboard (counts as a finished run). */
export async function finishRun(page: Page) {
  await page.goto('/#/') // leave the topic first, so the player starts again from step 1
  await page.goto('/#/topic/sum-demo')
  await expect(page.getByText('Step 1 of 9')).toBeVisible()
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight')
  await expect(page.getByText('Step 9 of 9')).toBeVisible()
}

export const hud = (page: Page) => page.getByRole('banner').getByRole('group', { name: 'Your progress' })

const RIGHT_ANSWERS = [
  ['What is total after the loop finishes for [2, 4, 6]?', '12'],
  ['How many times does the loop body run for [2, 4, 6]?', '3 times'],
  ['What does sum([]) return?', 'It returns 0'],
]

/** Answers every warm-up question correctly and checks the answers. */
export async function passQuiz(page: Page) {
  for (const [question, option] of RIGHT_ANSWERS) {
    await page.getByRole('group', { name: question }).getByRole('radio', { name: option }).check()
  }
  await page.getByRole('button', { name: 'Check answers' }).click()
}

export const yourDataButton = (page: Page) => hud(page).getByRole('button', { name: 'Your data' })
export const dataModal = (page: Page) => page.getByRole('dialog', { name: 'Your data' })

/** Opens the Your data modal from the header chip. */
export async function openYourData(page: Page) {
  await yourDataButton(page).click()
  await expect(dataModal(page)).toBeVisible()
}

export async function closeYourData(page: Page) {
  await dataModal(page).getByRole('button', { name: 'Close' }).click()
  await expect(dataModal(page)).toHaveCount(0)
}
