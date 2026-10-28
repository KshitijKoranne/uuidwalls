import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

const HERO = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

// Fraction of non-transparent pixels in a canvas (works for bitmaprenderer canvases too).
async function painted(page: Page, selector: string) {
  return page.evaluate(sel => {
    const c = document.querySelector<HTMLCanvasElement>(sel)
    if (!c || !c.width || !c.height) return 0
    const t = document.createElement('canvas'); t.width = Math.min(c.width, 200); t.height = Math.min(c.height, 120)
    const x = t.getContext('2d')!; x.drawImage(c, 0, 0, t.width, t.height)
    const d = x.getImageData(0, 0, t.width, t.height).data
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++
    return n / (d.length / 4)
  }, selector)
}
const heroHash = (page: Page) => page.evaluate(async () => {
  const c = document.querySelector<HTMLCanvasElement>('#hero canvas')!
  const t = document.createElement('canvas'); t.width = c.width; t.height = c.height
  t.getContext('2d')!.drawImage(c, 0, 0)
  const buf = await crypto.subtle.digest('SHA-256', t.getContext('2d')!.getImageData(0, 0, t.width, t.height).data)
  return Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')
})

test.use({ viewport: { width: 1280, height: 720 } })

test('home paints the hero wall, then the thumbnails as they scroll into view', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/')
  await expect.poll(() => painted(page, '#hero canvas'), { timeout: 15_000 }).toBeGreaterThan(0.9)
  await expect(page.getByText('Live · rendering')).toBeVisible()
  await page.getByText('Same UUID. Six faces.').scrollIntoViewIfNeeded()
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('canvas')].filter(c => c.width > 0).length), { timeout: 15_000 }).toBeGreaterThanOrEqual(7)
  expect(errors).toEqual([])
})

test('legacy permalink ?uuid=&p= still selects the wall; unknown family falls back to Flow Field', async ({ page }) => {
  await page.goto(`/?uuid=${HERO}&p=voronoi`)
  await expect(page.getByRole('button', { name: 'Voronoi', pressed: true })).toBeVisible()
  await expect(page.getByLabel('Device UUID')).toHaveValue(HERO)
  await page.goto(`/?uuid=${HERO}&p=nonsense`)
  await expect(page.getByRole('button', { name: 'Flow Field', pressed: true })).toBeVisible()
})

test('switching family re-renders and updates the permalink', async ({ page }) => {
  await page.goto(`/?uuid=${HERO}&p=geometric`)
  await expect.poll(() => painted(page, '#hero canvas'), { timeout: 15_000 }).toBeGreaterThan(0.9)
  const before = await heroHash(page)
  await page.getByRole('button', { name: 'Wave', exact: true }).click()
  await expect.poll(() => heroHash(page), { timeout: 15_000 }).not.toBe(before)
  expect(page.url()).toContain('p=wave')
})

test('Screen download produces a PNG of the screen size; 2K asks to sign in', async ({ page }) => {
  await page.goto(`/?uuid=${HERO}&p=geometric`)
  await expect.poll(() => painted(page, '#hero canvas'), { timeout: 15_000 }).toBeGreaterThan(0.9)
  await page.getByRole('button', { name: /Download/ }).click()
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByText('Screen resolution', { exact: true }).click()])
  expect(dl.suggestedFilename()).toBe('uuidwalls-f47ac10b-geometric-screen.png')
  const buf = readFileSync(await dl.path())
  expect(buf.subarray(1, 4).toString()).toBe('PNG')
  expect([buf.readUInt32BE(16), buf.readUInt32BE(20)]).toEqual([1280, 720])

  await page.getByRole('button', { name: /Download/ }).click()
  await page.getByText(/^2K — unlock/).click()
  await expect(page.getByText('Unlock 2K & 4K Downloads')).toBeVisible()
})

test('a huge render request is refused instead of crashing the tab', async ({ page }) => {
  await page.goto('/lab')
  await page.waitForFunction(() => !!window.__lab)
  const msg = await page.evaluate(async () => { try { await window.__lab.hash('worker', { uuid: 'a', fam: 'wave', w: 9000, h: 9000 }); return 'rendered' } catch (e) { return String(e) } })
  expect(msg).toContain('too large')
})

test('download menu works from the keyboard: Enter opens, Tab reaches the sizes, Esc closes and returns focus', async ({ page }) => {
  await page.goto(`/?uuid=${HERO}&p=geometric`)
  await expect.poll(() => painted(page, '#hero canvas'), { timeout: 15_000 }).toBeGreaterThan(0.9)
  const trigger = page.getByRole('button', { name: /Download/ })
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: /Screen resolution/ })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(trigger).toBeFocused()
  // outside click closes too
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await page.mouse.click(5, 300)
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  // pick a size with Enter only
  await trigger.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Tab')
  const [dl] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Enter')])
  expect(dl.suggestedFilename()).toContain('-screen.png')
})

test('security headers: CSP allows the render worker and no longer lists the Razorpay checkout script', async ({ request }) => {
  const csp = (await request.get('/')).headers()['content-security-policy']
  expect(csp).toContain("worker-src 'self'")
  expect(csp).not.toContain('checkout.razorpay.com')
  expect(csp).toContain("frame-src 'none'")
})

test('payment API: signed-out checkout is refused, wrong origin is refused, webhook is not enabled for Razorpay', async ({ request }) => {
  expect((await request.post('/api/checkout')).status()).toBe(401)
  expect((await request.post('/api/checkout', { headers: { origin: 'https://evil.example' } })).status()).toBe(403)
  expect((await request.post('/api/payments/webhook', { data: '{}' })).status()).toBe(501)
  const old = await request.get('/api/razorpay/callback?razorpay_payment_link_status=cancelled', { maxRedirects: 0 })
  expect(old.status()).toBe(307)
  expect(old.headers()['location']).toContain('payment=cancelled')
})

test('dialogs are real modals: keyboard opens, focus moves inside and stays, Esc closes and focus returns to the trigger', async ({ page }) => {
  await page.goto(`/?uuid=${HERO}&p=geometric`)
  await expect.poll(() => painted(page, '#hero canvas'), { timeout: 15_000 }).toBeGreaterThan(0.9)
  const trigger = page.getByRole('button', { name: /Download/ })
  await trigger.focus(); await page.keyboard.press('Enter')
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab') // Screen, Mobile, 2K
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: /Unlock 2K & 4K Downloads/ })
  await expect(dialog).toBeVisible()
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true) // focus moved into the modal on open
  for (let i = 0; i < 8; i++) {
    // The page behind is inert: Tab may reach the browser's own UI, never the page content under the modal.
    expect(await page.evaluate(() => !document.activeElement?.closest('main, header, footer'))).toBe(true)
    await page.keyboard.press('Tab')
  }
  await page.locator('dialog').getByRole('button', { name: 'Close' }).focus()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
})
