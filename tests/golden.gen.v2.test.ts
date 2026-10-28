import { describe, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { drawWall } from '@/lib/wall/render'
import { parseUUID } from '@/lib/wall/params'
import { makeRecorder } from './helpers/recorder'
import { RENDER_UUIDS } from './helpers/fixtures'

// Flow Field is the one family whose output changed on purpose in v2 (seeded jitter instead of
// Math.random). This records the new, now reproducible, programs. Regenerate only with an
// ALGO_VERSION bump:  GEN_GOLDENS=1 npx vitest run tests/golden.gen.v2.test.ts
describe.skipIf(!process.env.GEN_GOLDENS)('generate v2 flow field goldens', () => {
  it('writes tests/golden/v2-flowfield.json', async () => {
    const out: Record<string, string> = {}
    for (const u of RENDER_UUIDS) {
      const rec = makeRecorder()
      await drawWall(rec.ctx, parseUUID(u, 'flowfield'), 480, 270, { hq: true })
      out[u] = rec.digest()
    }
    writeFileSync(new URL('./golden/v2-flowfield.json', import.meta.url), JSON.stringify(out, null, 1) + '\n')
  })
})

// Wall names are new in v2 (SPEC section 13). Pinned so a refactor cannot rename anyone's walls:
//   GEN_GOLDENS=1 npx vitest run tests/golden.gen.v2.test.ts
describe.skipIf(!process.env.GEN_GOLDENS)('generate wall name goldens', () => {
  it('writes tests/golden/names.json', async () => {
    const { wallName } = await import('@/lib/wall/name')
    const { FAMILIES, PARAM_INPUTS } = await import('./helpers/fixtures')
    const out: Record<string, Record<string, string>> = {}
    for (const u of PARAM_INPUTS) { out[u] = {}; for (const f of FAMILIES) out[u][f] = wallName(parseUUID(u, f)) }
    writeFileSync(new URL('./golden/names.json', import.meta.url), JSON.stringify(out, null, 1) + '\n')
  })
})
