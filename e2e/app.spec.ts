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
