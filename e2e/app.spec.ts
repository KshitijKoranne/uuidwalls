import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { HERO, stageHash, stagePainted } from './helpers'

test.use({ viewport: { width: 1280, height: 720 } })
const picker = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /Screen|Phone|2K|4K/ }).filter({ has: page.locator('small') })

test('home paints the stage, then the sample walls as they scroll into view', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/')
  await stagePainted(page)
  await expect(page.getByRole('status').filter({ hasText: 'Ready' })).toBeVisible()
  await page.getByRole('heading', { name: 'Explore' }).scrollIntoViewIfNeeded()
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('.ex canvas')].filter(c => (c as HTMLCanvasElement).width > 300).length), { timeout: 20_000 }).toBeGreaterThanOrEqual(5)
  expect(errors).toEqual([])
})

test('legacy ?uuid=&p= links still open that wall; the address bar moves to a token; unknown family falls back to Flow Field', async ({ page }) => {
  await page.goto(`/?uuid=${HERO}&p=voronoi`)
  await expect(page.getByRole('radio', { name: 'Voronoi' })).toBeChecked()
  await expect(page.getByLabel('Seed', { exact: true })).toHaveValue(HERO)
  await expect.poll(() => page.url()).toMatch(/\/\?w=[A-Za-z0-9_-]{18}$/)
  expect(page.url()).not.toContain(HERO)
  await page.goto(`/?uuid=${HERO}&p=nonsense`)
  await expect(page.getByRole('radio', { name: 'Flow Field' })).toBeChecked()
})

test('a ?w= token link opens that wall with the seed hidden', async ({ page }) => {
  await page.goto(`/?uuid=${HERO}&p=wave`)
  await expect.poll(() => page.url()).toContain('?w=')
  const url = page.url()
  await page.goto(url)
  await expect(page.getByRole('radio', { name: 'Wave' })).toBeChecked()
  await expect(page.getByLabel('Seed', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Seed', { exact: true })).toHaveAttribute('placeholder', /hidden/)
  await expect(page.getByRole('heading', { level: 2, name: 'Lime Tide' })).toBeVisible()
})

test('switching pattern redraws, renames the wall line and moves the token', async ({ page }) => {
  await page.goto(`/?uuid=${HERO}&p=geometric`)
  const before = await stageHash(page); const urlBefore = page.url()
  await page.getByRole('radio', { name: 'Wave' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Lime Tide' })).toBeVisible()
  await expect.poll(() => stageHash(page), { timeout: 20_000 }).not.toBe(before)
  expect(page.url()).not.toBe(urlBefore)
})

test('pattern tiles are a radio group: arrow keys move the choice', async ({ page }) => {
  await page.goto(`/?uuid=${HERO}&p=flowfield`)
  await page.getByRole('radio', { name: 'Flow Field' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: 'Voronoi' })).toBeChecked()
  await expect(page.getByRole('radio', { name: 'Voronoi' })).toBeFocused()
})

test('Download saves the chosen size with the wall name in the file name (no UUID)', async ({ page }) => {
  await page.goto(`/?uuid=${HERO}&p=geometric`)
  await stagePainted(page)
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download' }).click()])
  expect(dl.suggestedFilename()).toBe('uuidwalls-lime-facets-screen.png')
  const buf = readFileSync(await dl.path())
  expect(buf.subarray(1, 4).toString()).toBe('PNG')
  expect([buf.readUInt32BE(16), buf.readUInt32BE(20)]).toEqual([1280, 720])
  await expect(page.getByText('Saved to your downloads.')).toBeVisible()
})

test('size menu: keyboard path, Phone is free, locked sizes show the price and open the unlock sheet', async ({ page }) => {
  await page.goto(`/?uuid=${HERO}&p=geometric`)
  await stagePainted(page)
  const trigger = picker(page)
  await trigger.focus(); await page.keyboard.press('Enter')
  await expect(page.getByRole('menu', { name: 'Download size' })).toBeVisible()
  await expect(page.getByRole('menuitemradio', { name: /Screen/ })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('menuitemradio', { name: /Phone/ })).toBeFocused()
  await expect(page.getByRole('menuitemradio', { name: /4K/ })).toContainText('₹99')
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await trigger.click(); await page.getByRole('menuitemradio', { name: /Phone/ }).click()
  await expect(trigger).toContainText('Phone')
  await trigger.click(); await page.getByRole('menuitemradio', { name: /2K/ }).click()
  await expect(page.getByRole('dialog', { name: /Unlock 2K & 4K/ })).toBeVisible()
})

test('the unlock sheet is a real modal: focus inside, Esc closes, focus returns to the size picker', async ({ page }) => {
  await page.goto(`/?uuid=${HERO}&p=geometric`)
  await stagePainted(page)
  const trigger = picker(page)
  await trigger.focus(); await page.keyboard.press('Enter')
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown') // 2K
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: /Unlock 2K & 4K/ })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('₹99 once. No subscription.')).toBeVisible()
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true)
  for (let i = 0; i < 8; i++) {
    expect(await page.evaluate(() => !document.activeElement?.closest('main, header, footer'))).toBe(true) // the page behind is inert
    await page.keyboard.press('Tab')
  }
  await dialog.getByRole('button', { name: 'Close' }).focus()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('unlock flow: signed out, Continue goes to sign-in inside the same sheet (step 2 of 3)', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Unlock 2K & 4K' }).first().click()
  const dialog = page.getByRole('dialog', { name: /Unlock 2K & 4K/ })
  await dialog.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('dialog', { name: /Sign in to unlock 2K & 4K/ })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Step 2 of 3' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
})

test('seed field explains bad input instead of guessing, and cleans good input', async ({ page }) => {
  await page.goto('/')
  const seed = page.getByLabel('Seed', { exact: true })
  await seed.fill('hello world')
  await expect(page.getByText(/Only 0-9 and a-f are allowed. We found:/)).toBeVisible()
  await expect(page.getByRole('radiogroup', { name: 'Pattern' })).toHaveAttribute('aria-disabled', 'true')
  await seed.fill('f47ac10b')
  await expect(page.getByText(/That’s too short/)).toBeVisible()
  const hashBefore = await stageHash(page)
  await seed.fill('A1B2C3D4E5F67890ABCDEF1234567890')
  await expect(page.getByText(/We cleaned up your input/)).toBeVisible()
  await expect(seed).toHaveValue('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
  await expect(page.getByRole('radiogroup', { name: 'Pattern' })).toHaveAttribute('aria-disabled', 'false')
  await expect.poll(() => stageHash(page), { timeout: 20_000 }).not.toBe(hashBefore)
  expect(page.url()).toMatch(/\?w=/); expect(page.url()).not.toContain('a1b2c3d4')
})

test('Space makes a random seed; H hides and shows the controls and moves focus', async ({ page }) => {
  await page.goto('/')
  await stagePainted(page)
  const seed = page.getByLabel('Seed', { exact: true })
  const before = await seed.inputValue()
  await page.locator('body').click({ position: { x: 20, y: 300 } })
  await page.keyboard.press('Space')
  await expect.poll(() => seed.inputValue()).not.toBe(before)
  await expect(page.getByText('Random seed. Save it to keep it.')).toBeVisible()
  await page.keyboard.press('h')
  await expect(page.getByRole('button', { name: 'Show controls' })).toBeFocused()
  await expect(page.locator('#panel')).toHaveClass(/closed/)
  await page.getByRole('button', { name: 'Show controls' }).click()
  await expect(page.locator('#panel')).not.toHaveClass(/closed/)
})

test('Find my UUID shows the command for this machine and can copy it', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await page.getByRole('button', { name: 'Find my UUID' }).click()
  const dialog = page.getByRole('dialog', { name: 'Find my UUID' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('radio', { name: 'Linux' }).click()
  await expect(dialog.getByText('cat /etc/machine-id')).toBeVisible()
  await dialog.getByRole('button', { name: 'Copy' }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('cat /etc/machine-id')
})

test('a huge render request is refused instead of crashing the tab', async ({ page }) => {
  await page.goto('/lab')
  await page.waitForFunction(() => !!window.__lab)
  const msg = await page.evaluate(async () => { try { await window.__lab.hash('worker', { uuid: 'a', fam: 'wave', w: 9000, h: 9000 }); return 'rendered' } catch (e) { return String(e) } })
  expect(msg).toContain('too large')
})

test('security headers: CSP allows the render worker, has no third parties, no Razorpay script', async ({ request }) => {
  const csp = (await request.get('/')).headers()['content-security-policy']
  expect(csp).toContain("worker-src 'self'")
  expect(csp).not.toContain('checkout.razorpay.com')
  expect(csp).not.toMatch(/googleapis|gstatic/)
  expect(csp).toContain("frame-src 'none'")
})

test('payment API: signed-out checkout is refused, wrong origin is refused, webhook is not enabled for Razorpay, old callback still resolves', async ({ request }) => {
  expect((await request.post('/api/checkout')).status()).toBe(401)
  expect((await request.post('/api/checkout', { headers: { origin: 'https://evil.example' } })).status()).toBe(403)
  expect((await request.post('/api/payments/webhook', { data: '{}' })).status()).toBe(501)
  const old = await request.get('/api/razorpay/callback?razorpay_payment_link_status=cancelled', { maxRedirects: 0 })
  expect(old.status()).toBe(307)
  expect(old.headers()['location']).toContain('payment=cancelled')
})

test.describe('phone width (390)', () => {
  test.use({ viewport: { width: 390, height: 844 } })
  test('stacked layout: no sideways scroll, Download stays reachable, menu opens as a sheet', async ({ page }) => {
    await page.goto('/')
    await stagePainted(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const dl = page.getByRole('button', { name: 'Download' })
    await expect(dl).toBeVisible()
    const box = await dl.boundingBox()
    expect(box!.y + box!.height).toBeLessThanOrEqual(844)
    expect(box!.height).toBeGreaterThanOrEqual(44)
    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0)
  })
})

test('first paint is quick: a coarse picture of the wall shows while the sharp one is still rendering', async ({ page }) => {
  await page.goto('/') // Flow Field is the slowest family and the default
  await expect.poll(() => import('./helpers').then(h => h.painted(page, '#stage canvas.coarse')), { timeout: 4000 }).toBeGreaterThan(0.5)
  await expect(page.getByRole('status').filter({ hasText: 'Sharpening' })).toBeVisible()
  await stagePainted(page)
  await expect(page.getByRole('status').filter({ hasText: 'Ready' })).toBeVisible()
})

test('a toast shown while a dialog is open is on top of it and can be clicked (not hidden under the modal)', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await page.getByRole('button', { name: 'Find my UUID' }).click()
  const dialog = page.getByRole('dialog', { name: 'Find my UUID' })
  await dialog.getByRole('button', { name: 'Copy' }).click()
  const toast = dialog.locator('.toast') // a modal makes the page behind inert, so the dialog carries its own toast
  await expect(toast).toContainText('Command copied')
  await expect(page.locator('#toast')).toBeHidden() // the page's copy steps aside: one live region only
  const topmost = await page.evaluate(() => {
    const r = document.querySelector('dialog .toast')!.getBoundingClientRect()
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return !!el?.closest('.toast')
  })
  expect(topmost).toBe(true)
})
