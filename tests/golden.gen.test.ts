import { describe, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { legacy } from './legacy/adapter'
import { collectParams, collectPrng, collectRender, collectWatermark, renderJobs, type Goldens } from './helpers/collect'

// Regenerates tests/golden/v1.json FROM THE UNMODIFIED v1 ENGINE. Run only when fixtures change:
//   GEN_GOLDENS=1 npx vitest run tests/golden.gen.test.ts
describe.skipIf(!process.env.GEN_GOLDENS)('generate v1 goldens', () => {
  it('writes tests/golden/v1.json', async () => {
    const renders: Goldens['renders'] = {}
    for (const job of renderJobs()) renders[job.key] = await collectRender(legacy, job)
    const goldens: Goldens = { params: await collectParams(legacy), ...collectPrng(legacy), renders, watermark: collectWatermark(legacy) }
    writeFileSync(new URL('./golden/v1.json', import.meta.url), JSON.stringify(goldens, null, 1) + '\n')
  })
})
