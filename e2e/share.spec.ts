import { expect, test, type Page } from '@playwright/test'
import { parseUUID } from '../lib/wall/params'
import { decodeWall, encodeWall } from '../lib/wall/token'

const UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const tokenFor = (fam: string, uuid = UUID) => encodeWall(parseUUID(uuid, fam))

async function heroHash(page: Page) {
  await expect.poll(() => page.evaluate(() => { const c = document.querySelector<HTMLCanvasElement>('#hero canvas'); return !!c && c.width >= 1000 }), { timeout: 20_000 }).toBe(true) // 300 = not drawn yet
  await page.waitForTimeout(300)
  return page.evaluate(async () => {
    const c = document.querySelector<HTMLCanvasElement>('#hero canvas')!
    const t = document.createElement('canvas'); t.width = c.width; t.height = c.height
    const x = t.getContext('2d')!; x.drawImage(c, 0, 0)
    const buf = await crypto.subtle.digest('SHA-256', x.getImageData(0, 0, t.width, t.height).data)
    return Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')
  })
}

function jpegSize(buf: Buffer) {
  for (let i = 2; i < buf.length - 9;) {
    if (buf[i] !== 0xff) { i++; continue }
    const m = buf[i + 1]
    if (m >= 0xc0 && m <= 0xc3) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) }
    i += 2 + buf.readUInt16BE(i + 2)
  }
  return null
}

test.use({ viewport: { width: 1280, height: 720 } })

for (const fam of ['voronoi', 'geometric', 'flowfield']) {
  test(`a shared link draws exactly the wall the raw-UUID link draws: ${fam}`, async ({ page }) => {
    await page.goto(`/?uuid=${UUID}&p=${fam}`)
    const raw = await heroHash(page)
    await page.goto(`/w/${tokenFor(fam)}`)
    expect(await heroHash(page)).toBe(raw)
  })
}

test('shared wall page: no UUID anywhere, switching family moves to that family\'s token, typing a UUID leaves shared mode', async ({ page }) => {
  await page.goto(`/w/${tokenFor('geometric')}`)
  const input = page.getByLabel('Device UUID')
  await expect(input).toHaveValue('')
  await expect(input).toHaveAttribute('placeholder', /Shared wall/)
  await page.getByRole('button', { name: 'Wave', exact: true }).click()
  await expect.poll(() => new URL(page.url()).pathname).toBe(`/w/${tokenFor('wave')}`)
  await input.fill('deadbeef-cafe-4abe-b00d-123456789abc')
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 5000 }).toBe('/')
  await expect.poll(() => page.url()).toContain('uuid=deadbeef')
})

test.describe('share menu', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })
  const clip = (page: Page) => page.evaluate(() => navigator.clipboard.readText())

  test('default link hides the UUID; the raw link is a separate explicit choice', async ({ page }) => {
    await page.goto(`/?uuid=${UUID}&p=voronoi`)
    await heroHash(page)
    await page.getByRole('button', { name: 'Share', exact: true }).click()
    await page.getByRole('button', { name: /Copy link · hides your UUID/ }).click()
    const priv = await clip(page)
    expect(priv).toBe(`http://127.0.0.1:3100/w/${tokenFor('voronoi')}`)
    expect(priv).not.toContain('f47ac10b')
    await page.getByRole('button', { name: 'Share', exact: true }).click()
    await page.getByRole('button', { name: /Copy link with my UUID/ }).click()
    expect(await clip(page)).toBe(`http://127.0.0.1:3100/?uuid=${UUID}&p=voronoi`)
  })

  test('on a shared wall the raw-UUID option does not exist (there is no UUID to share)', async ({ page }) => {
    await page.goto(`/w/${tokenFor('wave')}`)
    await page.getByRole('button', { name: 'Share', exact: true }).click()
    await expect(page.getByRole('button', { name: /Copy link · hides your UUID/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /with my UUID/ })).toHaveCount(0)
  })

  test('Esc closes the menu and returns focus to Share', async ({ page }) => {
    await page.goto('/')
    const share = page.getByRole('button', { name: 'Share', exact: true })
    await share.click(); await page.keyboard.press('Escape')
    await expect(share).toHaveAttribute('aria-expanded', 'false'); await expect(share).toBeFocused()
  })
})

test.describe('share image and metadata', () => {
  for (const fam of ['geometric', 'voronoi', 'ascii']) {
    test(`/w/<token>/og.jpg is a 1200x630 JPEG, cached for a year: ${fam}`, async ({ request }) => {
      const r = await request.get(`/w/${tokenFor(fam)}/og.jpg`)
      expect(r.status()).toBe(200)
      expect(r.headers()['content-type']).toBe('image/jpeg')
      expect(r.headers()['cache-control']).toContain('immutable')
      const body = await r.body()
      expect(body.subarray(0, 3).toString('hex')).toBe('ffd8ff')
      expect(jpegSize(body)).toEqual({ w: 1200, h: 630 })
      expect(body.length).toBeLessThan(700_000) // chat apps drop heavy previews
    })
  }

  test('same wall = same image bytes (render is deterministic on the server)', async ({ request }) => {
    const a = await (await request.get(`/w/${tokenFor('mandala')}/og.jpg`)).body()
    const b = await (await request.get(`/w/${tokenFor('mandala')}/og.jpg`)).body()
    expect(a.equals(b)).toBe(true)
  })

  test('invalid or tampered tokens are 404 for the image and the page', async ({ request }) => {
    const good = tokenFor('wave')
    const tampered = good.slice(0, 5) + (good[5] === 'A' ? 'B' : 'A') + good.slice(6)
    for (const t of ['nope', 'A'.repeat(18), tampered]) {
      expect(decodeWall(t)).toBeNull()
      expect((await request.get(`/w/${t}/og.jpg`)).status()).toBe(404)
      expect((await request.get(`/w/${t}`)).status()).toBe(404)
    }
  })

  test('the page carries Open Graph and Twitter tags for that wall and is not indexed', async ({ request }) => {
    const t = tokenFor('voronoi', 'deadbeef-cafe-4abe-b00d-123456789abc')
    const html = await (await request.get(`/w/${t}`)).text()
    expect(html).toMatch(new RegExp(`<meta property="og:image" content="[^"]*/w/${t}/og\\.jpg"`))
    expect(html).toContain('property="og:image:width" content="1200"')
    expect(html).toContain('name="twitter:card" content="summary_large_image"')
    expect(html).toMatch(/<meta name="robots" content="noindex/)
    expect(html).toContain('Voronoi wall')
    expect(html).not.toContain('deadbeef-cafe')
    expect(html).not.toContain('f47ac10b-58cc') // not even the site's default UUID: a shared page starts empty
  })
})
