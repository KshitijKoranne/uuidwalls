import { expect, test } from '@playwright/test'

const UUIDS = ['f47ac10b-58cc-4372-a567-0e02b2c3d479', 'deadbeef-cafe-4abe-b00d-123456789abc', '00000000-0000-0000-0000-000000000000']
const FAMS = ['flowfield', 'voronoi', 'geometric', 'ascii', 'mandala', 'wave']

test.beforeEach(async ({ page }) => {
  await page.goto('/lab')
  await page.waitForFunction(() => !!(window as unknown as { __lab?: unknown }).__lab)
})

// The worker must draw exactly what the same engine draws on the main thread (same browser build).
for (const fam of FAMS) {
  test(`worker output is pixel-identical to main thread: ${fam}`, async ({ page }) => {
    for (const uuid of UUIDS) {
      const r = { uuid, fam, w: 480, h: 270 }
      const [a, b] = await page.evaluate(async r => [await window.__lab.hash('worker', r), await window.__lab.hash('main', r)], r)
      expect(a, `${fam} ${uuid}`).toBe(b)
    }
  })
}

// And v1 itself: only Flow Field may differ (v1 used Math.random there).
for (const fam of FAMS.filter(f => f !== 'flowfield')) {
  test(`worker output equals the v1 engine pixel for pixel: ${fam}`, async ({ page }) => {
    const r = { uuid: UUIDS[0], fam, w: 480, h: 270 }
    const [a, b] = await page.evaluate(async r => [await window.__lab.hash('worker', r), await window.__lab.hash('v1', r)], r)
    expect(a).toBe(b)
  })
}

test('same UUID renders the same Flow Field wall every time', async ({ page }) => {
  const r = { uuid: UUIDS[0], fam: 'flowfield', w: 480, h: 270 }
  const [a, b] = await page.evaluate(async r => [await window.__lab.hash('worker', r), await window.__lab.hash('worker', r)], r)
  expect(a).toBe(b)
})

test('rapid family switches: older renders are cancelled, the last one is what is on screen', async ({ page }) => {
  const res = await page.evaluate(() => window.__lab.cancelRace(['flowfield', 'voronoi', 'wave', 'geometric', 'voronoi'], 'f47ac10b-58cc-4372-a567-0e02b2c3d479'))
  expect(res.fulfilled).toBe(1)
  expect(res.aborted).toBe(4)
  expect(res.finalMatchesLast).toBe(true)
})
