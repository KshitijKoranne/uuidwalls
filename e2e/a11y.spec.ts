import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { HERO, stagePainted } from './helpers'

// Automated WCAG 2.1 A/AA checks on every route and on the dialogs. Automated tools find roughly a third of
// real problems (contrast over an animated canvas is out of their reach), so this complements, not replaces,
// the keyboard and screen reader checks. Contrast over the wall itself is covered by the scrim/glass design.
const scan = async (page: Page, selector?: string) => {
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  if (selector) b = b.include(selector)
  const r = await b.analyze()
  return r.violations.map(v => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`)
}

test.use({ viewport: { width: 1280, height: 720 } })

test('home has no WCAG A/AA violations the scanner can see', async ({ page }) => {
  await page.goto(`/?uuid=${HERO}&p=geometric`)
  await stagePainted(page)
  // the wall itself changes colour under text; contrast there is by design (scrim, glass), so scan the UI regions
  expect(await scan(page, '#panel')).toEqual([])
  expect(await scan(page, 'header')).toEqual([])
  await page.getByRole('heading', { name: 'Questions' }).scrollIntoViewIfNeeded()
  expect(await scan(page, 'main > section:not(.stage)')).toEqual([])
  expect(await scan(page, 'footer')).toEqual([])
})

for (const path of ['/walls', '/privacy', '/terms', '/refund']) {
  test(`${path} has no WCAG A/AA violations the scanner can see`, async ({ page }) => {
    await page.goto(path)
    expect(await scan(page)).toEqual([])
  })
}

test('dialogs have no violations', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Find my UUID' }).click()
  expect(await scan(page, 'dialog')).toEqual([])
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Unlock 2K & 4K' }).first().click()
  expect(await scan(page, 'dialog')).toEqual([])
  await page.getByRole('dialog').getByRole('button', { name: 'Continue' }).click()
  expect(await scan(page, 'dialog')).toEqual([])
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Share', exact: true }).click()
  expect(await scan(page, 'dialog')).toEqual([])
})
