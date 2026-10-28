import { expect, test } from '@playwright/test'
import { HERO, stagePainted } from './helpers'

test.use({ viewport: { width: 1280, height: 720 } })

async function save(page: import('@playwright/test').Page, fam = 'wave') {
  await page.goto(`/?uuid=${HERO}&p=${fam}`)
  await stagePainted(page)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
}

test('Save keeps a wall on this device: toast, count, My walls page, still there after a reload; no UUID is stored', async ({ page }) => {
  await save(page)
  await expect(page.getByText('Saved to My walls')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Saved' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('link', { name: /My walls/ }).first()).toContainText('1')
  const stored = await page.evaluate(() => localStorage.getItem('uw_walls_v1'))
  expect(stored).toContain('"token"'); expect(stored).not.toContain('f47ac10b')
  await page.getByRole('link', { name: /My walls/ }).first().click()
  await expect(page.getByRole('heading', { name: 'My walls' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Open Lime Tide in the studio/ })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: /Open Lime Tide in the studio/ })).toBeVisible()
})

test('saving the same wall twice says so; unsaving offers Undo', async ({ page }) => {
  await save(page)
  await expect(page.getByText('Saved to My walls')).toBeVisible()
  await page.getByRole('button', { name: 'Saved' }).click() // second tap removes, with Undo
  await expect(page.getByText('Removed “Lime Tide”.')).toBeVisible()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible()
})

test('empty library: title, one sentence, one action', async ({ page }) => {
  await page.goto('/walls')
  await expect(page.getByRole('heading', { name: 'No walls saved yet' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Make a wall' })).toBeVisible()
  await page.getByRole('tab', { name: /Favourites/ }).click()
  await expect(page.getByRole('heading', { name: 'No favourites yet' })).toBeVisible()
})

test('favourite, rename, delete with Undo, and collections', async ({ page }) => {
  await save(page)
  await page.goto('/walls')
  const card = page.locator('li.card').first()
  await card.getByRole('button', { name: /Add Lime Tide to favourites/ }).click()
  await expect(page.getByText('Added to Favourites')).toBeVisible()
  await page.getByRole('tab', { name: /Favourites/ }).click()
  await expect(page.locator('li.card')).toHaveCount(1)
  await page.getByRole('tab', { name: /^All/ }).click()

  await card.getByRole('button', { name: 'Rename Lime Tide' }).click()
  await card.getByLabel('Wall name').fill('Desk wall'); await page.keyboard.press('Enter')
  await expect(card.getByRole('button', { name: 'Rename Desk wall' })).toHaveText('Desk wall')

  await page.getByRole('button', { name: '+ New collection' }).click()
  await page.getByLabel('Collection name').fill('Desktop'); await page.keyboard.press('Enter')
  await expect(page.getByRole('tab', { name: /Desktop/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('heading', { name: 'This collection is empty' })).toBeVisible()
  await page.getByRole('tab', { name: /^All/ }).click()
  await card.getByRole('button', { name: /More for Desk wall/ }).click()
  await page.getByRole('menuitem', { name: 'Desktop' }).click()
  await page.getByRole('tab', { name: /Desktop/ }).click()
  await expect(page.locator('li.card')).toHaveCount(1)

  await page.locator('li.card').first().getByRole('button', { name: /More for Desk wall/ }).click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await expect(page.getByText('Deleted “Desk wall”.')).toBeVisible()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.locator('li.card')).toHaveCount(1)
})

test('search finds by name; "Open in studio" returns to the stage on that wall with the seed hidden and a way back', async ({ page }) => {
  await save(page)
  await page.goto('/walls')
  await page.getByLabel('Search walls').fill('zzz')
  await expect(page.getByRole('heading', { name: /Nothing matches/ })).toBeVisible()
  await page.getByRole('button', { name: 'Clear search' }).click()
  await page.getByRole('button', { name: /Open Lime Tide in the studio/ }).click()
  await expect(page).toHaveURL(/\/$|\/\?w=/)
  await stagePainted(page)
  await expect(page.getByRole('heading', { level: 2, name: 'Lime Tide' })).toBeVisible()
  await expect(page.getByLabel('Seed', { exact: true })).toHaveAttribute('placeholder', /hidden/)
  await expect(page.getByRole('link', { name: 'My walls' }).filter({ hasText: /^My walls$/ })).toBeVisible()
})

test('a damaged library never breaks the page', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('uw_walls_v1', '{not json'))
  await page.goto('/walls')
  await expect(page.getByRole('heading', { name: 'No walls saved yet' })).toBeVisible()
})
