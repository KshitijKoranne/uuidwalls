import { ensureMonoFont } from './fonts'
import { MAX_PIXELS } from './constants'
import type { RenderSpec } from './protocol'
import { drawWall, drawWatermark } from './render'
import { makeCheckpoint } from './scheduling'
import type { Ctx2D } from './types'

export interface Surface { canvas: HTMLCanvasElement | OffscreenCanvas; ctx: Ctx2D }

export interface RunHooks {
  createSurface(w: number, h: number): Surface
  isCancelled(): boolean
  onProgress?(ratio: number): void
}

/** One render, identical in a worker and on the main thread: only the surface and hooks differ. */
export async function runRender(spec: RenderSpec, hooks: RunHooks): Promise<Surface> {
  if (!(spec.w > 0 && spec.h > 0) || spec.w * spec.h > MAX_PIXELS) throw new Error('Image size is not supported on this device')
  if (spec.P.family === 'ascii' || spec.watermark) await ensureMonoFont()
  const surface = hooks.createSurface(spec.w, spec.h)
  await drawWall(surface.ctx, spec.P, spec.w, spec.h, {
    hq: spec.hq,
    checkpoint: makeCheckpoint({ isCancelled: hooks.isCancelled, onProgress: hooks.onProgress }),
  })
  if (spec.watermark) drawWatermark(surface.ctx, spec.w, spec.h, spec.P)
  return surface
}
