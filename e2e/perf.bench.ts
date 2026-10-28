import { expect, test } from '@playwright/test'

// Main-thread responsiveness while a big wall renders. Numbers are printed so they can go in the PR;
// the assertions are deliberately loose (CI machines vary): the page must stay responsive.
const U = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const CASES = [
  { fam: 'voronoi', w: 3840, h: 2160 },
  { fam: 'flowfield', w: 3840, h: 2160 },
  { fam: 'geometric', w: 3840, h: 2160 },
  { fam: 'ascii', w: 3840, h: 2160 },
]

for (const throttle of [1, 4]) {
  for (const c of CASES) {
    test(`4K ${c.fam}, CPU x${throttle}: worker keeps the main thread free (v1 for comparison)`, async ({ page }) => {
      test.setTimeout(600_000)
      await page.goto('/lab')
      await page.waitForFunction(() => !!window.__lab)
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle })
      const r = { uuid: U, fam: c.fam, w: c.w, h: c.h }
      const worker = await page.evaluate(async r => ({ ...(await window.__lab.measure('worker', r)), ...(await window.__lab.jank('worker', r)) }), r)
      const v1 = await page.evaluate(async r => ({ ...(await window.__lab.measure('v1', r)), ...(await window.__lab.jank('v1', r)) }), r)
      console.log(`PERF ${c.fam} ${c.w}x${c.h} cpu x${throttle} | worker: ${JSON.stringify(worker)} | v1 main thread: ${JSON.stringify(v1)}`)
      expect(worker.worstTimerLagMs).toBeLessThan(150)
    })
  }
}
