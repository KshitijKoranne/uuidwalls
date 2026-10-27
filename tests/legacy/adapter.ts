import * as V1 from './engine.v1'
import { fakeCanvas } from '../helpers/recorder'
import type { EngineUnderTest } from '../helpers/collect'

// Drives the verbatim v1 engine. v1 uses requestAnimationFrame for chunking and Math.random for the
// flow field jitter, so both are replaced for the duration of a draw.
export const legacy: EngineUnderTest = {
  parseUUID: V1.parseUUID as EngineUnderTest['parseUUID'],
  uuidSeed: V1.uuidSeed,
  mkPRNG: V1.mkPRNG,
  mkNoise: V1.mkNoise,
  draw(ctx, P, w, h, hq, rand) {
    const g = globalThis as unknown as { requestAnimationFrame?: (f: () => void) => void }
    const prevRaf = g.requestAnimationFrame, prevRandom = Math.random
    g.requestAnimationFrame = f => f()
    Math.random = rand
    return new Promise<void>((resolve, reject) => {
      try {
        V1.drawCanvas(fakeCanvas(ctx), P as unknown as V1.UUIDParams, w, h, () => {}, () => resolve(), hq)
      } catch (e) { reject(e) }
    }).finally(() => { g.requestAnimationFrame = prevRaf; Math.random = prevRandom })
  },
  watermark(ctx, w, h, P) { V1.applyWatermark(ctx, w, h, P as unknown as V1.UUIDParams, true) },
}
