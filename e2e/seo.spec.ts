import { expect, test } from '@playwright/test'

test('robots.txt lets bots fetch share cards, blocks api/auth, and points to the sitemap', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text()
  expect(txt).toContain('Disallow: /api/')
  expect(txt).toContain('Disallow: /auth/')
  expect(txt).not.toMatch(/Disallow: \/w\//)
  expect(txt).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/)
})

test('sitemap lists the public pages and no shared walls', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  for (const p of ['/', '/privacy', '/terms', '/refund']) expect(xml).toMatch(new RegExp(`<loc>https?://[^<]+${p === '/' ? '/' : p}</loc>`))
  expect(xml).not.toContain('/w/')
})

test('home: FAQPage JSON-LD matches the visible FAQ; WebApplication present; canonical is /', async ({ page }) => {
  await page.goto('/')
  const blocks = await page.$$eval('script[type="application/ld+json"]', els => els.map(e => JSON.parse(e.textContent || '{}')))
  const faq = blocks.find(b => b['@type'] === 'FAQPage')
  expect(blocks.some(b => b['@type'] === 'WebApplication')).toBe(true)
  const visible = await page.$$eval('summary', els => els.map(e => e.textContent?.trim()))
  for (const e of faq.mainEntity) expect(visible).toContain(e.name)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https?:\/\/[^/]+\/?$/)
})

test('legal pages have their own canonical URL; a shared wall has no FAQ JSON-LD and is noindex', async ({ page }) => {
  for (const p of ['/privacy', '/terms', '/refund']) {
    await page.goto(p)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(p + '$'))
  }
  await page.goto('/w/EGNGR47fYhWdL5z-me')
  const types = await page.$$eval('script[type="application/ld+json"]', els => els.map(e => JSON.parse(e.textContent || '{}')['@type']))
  expect(types).toEqual(['WebApplication'])
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})
