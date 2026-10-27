import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { drawWall, drawWatermark } from '@/lib/wall/render'
import { parseUUID } from '@/lib/wall/params'
import { mkPRNG, uuidSeed } from '@/lib/wall/prng'
import { mkNoise } from '@/lib/wall/noise'
import { collectParams, collectPrng, collectRender, collectWatermark, renderJobs, type EngineUnderTest, type Goldens } from './helpers/collect'
import { makeRecorder } from './helpers/recorder'
import { HERO, lcg } from './helpers/fixtures'

const goldens: Goldens = JSON.parse(readFileSync(new URL('./golden/v1.json', import.meta.url), 'utf8'))

const v2: EngineUnderTest = {
  parseUUID: parseUUID,
  uuidSeed, mkPRNG, mkNoise,
  draw: (ctx, P, w, h, hq, rand) => drawWall(ctx, P, w, h, { hq, rand }),
  watermark: (ctx, w, h, P) => drawWatermark(ctx, w, h, P),
}

// The contract of the redesign: the new engine issues exactly the same canvas program as v1
// (main@22d6f4b) for every fixed input. Goldens come from tests/legacy/engine.v1.ts, never from v2.
describe('v2 engine equals v1 (golden)', () => {
  it('parseUUID and uuidSeed match for 30 inputs, including malformed ones', async () => {
    expect(await collectParams(v2)).toEqual(goldens.params)
  })

  it('PRNG and noise streams match', () => {
    const { prng, noise } = collectPrng(v2)
    expect(prng).toEqual(goldens.prng)
    expect(noise).toEqual(goldens.noise)
  })

  it('watermark draw calls match', () => {
    expect(collectWatermark(v2)).toEqual(goldens.watermark)
  })

  const jobs = [...renderJobs()]
  it.each(jobs.map(j => [j.key, j] as const))('render %s', async (key, job) => {
    expect(await collectRender(v2, job)).toBe(goldens.renders[key])
  })

  it('covers every golden render exactly once', () => {
    expect(jobs.map(j => j.key).sort()).toEqual(Object.keys(goldens.renders).sort())
  })
})

describe('Flow Field jitter (intentional v2 change)', () => {
  const run = async (uuid: string) => {
    const rec = makeRecorder()
    await drawWall(rec.ctx, parseUUID(uuid, 'flowfield'), 320, 180, { hq: true })
    return rec.digest()
  }
  it('is reproducible with the default seeded jitter (v1 was not)', async () => {
    expect(await run(HERO)).toBe(await run(HERO))
  })
  it('differs between UUIDs', async () => {
    expect(await run(HERO)).not.toBe(await run('a1b2c3d4-e5f6-7890-abcd-ef1234567890'))
  })
  it('only the jitter source changed: injecting the v1 stand-in reproduces the v1 program', async () => {
    const rec = makeRecorder()
    await drawWall(rec.ctx, parseUUID(HERO, 'flowfield'), 480, 270, { hq: true, rand: lcg(777) })
    expect(rec.digest()).toBe(goldens.renders[`flowfield|${HERO}|480x270|hq`])
  })
})

describe('Flow Field v2 goldens (seeded jitter)', () => {
  const v2ff: Record<string, string> = JSON.parse(readFileSync(new URL('./golden/v2-flowfield.json', import.meta.url), 'utf8'))
  it.each(Object.entries(v2ff))('flowfield %s', async (uuid, digest) => {
    const rec = makeRecorder()
    await drawWall(rec.ctx, parseUUID(uuid, 'flowfield'), 480, 270, { hq: true })
    expect(rec.digest()).toBe(digest)
  })
})
