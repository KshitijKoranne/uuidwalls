import { expect, type Page } from '@playwright/test'

export const HERO = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

/** Fraction of non-transparent pixels in a canvas (works for bitmaprenderer canvases too). */
export async function painted(page: Page, selector: string) {
  return page.evaluate(sel => {
    const c = document.querySelector<HTMLCanvasElement>(sel)
    if (!c || !c.width || !c.height || c.width === 300) return 0 // 300x150 = never drawn
    const t = document.createElement('canvas'); t.width = Math.min(c.width, 200); t.height = Math.min(c.height, 120)
    const x = t.getContext('2d')!; x.drawImage(c, 0, 0, t.width, t.height)
    const d = x.getImageData(0, 0, t.width, t.height).data
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++
    return n / (d.length / 4)
  }, selector)
}

export const stagePainted = (page: Page) => expect.poll(() => painted(page, '#stage canvas'), { timeout: 20_000 }).toBeGreaterThan(0.9)

export async function stageHash(page: Page) {
  await stagePainted(page)
  await expect(page.getByRole('status').filter({ hasText: 'Ready' })).toBeVisible({ timeout: 20_000 })
  return page.evaluate(async () => {
    const c = document.querySelector<HTMLCanvasElement>('#stage canvas')!
    const t = document.createElement('canvas'); t.width = c.width; t.height = c.height
    const x = t.getContext('2d')!; x.drawImage(c, 0, 0)
    const buf = await crypto.subtle.digest('SHA-256', x.getImageData(0, 0, t.width, t.height).data)
    return Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')
  })
}
