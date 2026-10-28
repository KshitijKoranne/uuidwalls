import { makeRecorder } from './recorder'
import { FAMILIES, PARAM_INPUTS, RENDER_CASES, RENDER_UUIDS, lcg } from './fixtures'

// The surface both engines (legacy v1 and the new lib/wall) are driven through.
export interface EngineUnderTest {
  parseUUID(uuid: string, forceFamily?: string): { family: string; hue: number; sat: number; lum1: number; lum2: number; accent: number; density: number; angle: number; mood: number; seed: number }
  uuidSeed(uuid: string): number
  mkPRNG(seed: number): () => number
  mkNoise(seed: number): (x: number, y: number) => number
  /** Draw onto a recording context. `rand` replaces the flow field jitter source. */
  draw(ctx: CanvasRenderingContext2D, P: ReturnType<EngineUnderTest['parseUUID']>, w: number, h: number, hq: boolean, rand: () => number): Promise<void>
  watermark(ctx: CanvasRenderingContext2D, w: number, h: number, P: ReturnType<EngineUnderTest['parseUUID']>): void
}

export const JITTER_SEED = 777

export interface Goldens {
  params: Record<string, { auto: unknown; forced: Record<string, unknown>; seed: number }>
  prng: Record<string, string[]>
  noise: Record<string, string[]>
  renders: Record<string, string>
  watermark: Record<string, string>
}

export const renderKey = (fam: string, uuid: string, w: number, h: number, hq: boolean) => `${fam}|${uuid}|${w}x${h}|${hq ? 'hq' : 'lq'}`

export function* renderJobs() {
  for (const c of RENDER_CASES) for (const i of c.u) yield { ...c, uuid: RENDER_UUIDS[i], key: renderKey(c.fam, RENDER_UUIDS[i], c.w, c.h, c.hq) }
}

export async function collectParams(e: EngineUnderTest): Promise<Goldens['params']> {
  const out: Goldens['params'] = {}
  for (const input of PARAM_INPUTS) {
    const forced: Record<string, unknown> = {}
    for (const f of FAMILIES) forced[f] = e.parseUUID(input, f)
    out[input] = { auto: e.parseUUID(input), forced, seed: e.uuidSeed(input) }
  }
  return out
}

export function collectPrng(e: EngineUnderTest): Pick<Goldens, 'prng' | 'noise'> {
  const prng: Goldens['prng'] = {}, noise: Goldens['noise'] = {}
  for (const u of [RENDER_UUIDS[0], RENDER_UUIDS[2], RENDER_UUIDS[8], RENDER_UUIDS[9]]) {
    const seed = e.uuidSeed(u)
    const r = e.mkPRNG(seed)
    prng[u] = Array.from({ length: 24 }, () => String(r()))
    const n = e.mkNoise(seed)
    const g: string[] = []
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) g.push(String(n(x * 0.37 + 0.11, y * 0.53 - 7.3)))
    noise[u] = g
  }
  prng['seed0'] = (() => { const r = e.mkPRNG(0); return Array.from({ length: 8 }, () => String(r())) })()
  return { prng, noise }
}

export async function collectRender(e: EngineUnderTest, job: { fam: string; uuid: string; w: number; h: number; hq: boolean }) {
  const rec = makeRecorder()
  const P = e.parseUUID(job.uuid, job.fam)
  await e.draw(rec.ctx, P, job.w, job.h, job.hq, lcg(JITTER_SEED))
  return rec.digest()
}

export function collectWatermark(e: EngineUnderTest): Goldens['watermark'] {
  const out: Goldens['watermark'] = {}
  for (const [w, h] of [[800, 450], [3840, 2160], [1290, 2796]]) {
    const rec = makeRecorder()
    e.watermark(rec.ctx, w, h, e.parseUUID(RENDER_UUIDS[0], 'voronoi'))
    out[`${w}x${h}`] = rec.digest()
  }
  return out
}
