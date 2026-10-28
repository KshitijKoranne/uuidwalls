import { drawASCII } from './families/ascii'
import { drawFlowField } from './families/flowfield'
import { drawGeometric } from './families/geometric'
import { drawMandala } from './families/mandala'
import { drawVoronoi } from './families/voronoi'
import { drawWave } from './families/wave'
import type { Ctx2D, DrawOptions, UUIDParams } from './types'

/** Draws a wall onto `ctx`. The caller sizes the canvas to w x h first. Pure: no DOM access. */
export async function drawWall(ctx: Ctx2D, P: UUIDParams, w: number, h: number, o: DrawOptions = {}) {
  switch (P.family) {
    case 'flowfield': return drawFlowField(ctx, P, w, h, o)
    case 'voronoi': return drawVoronoi(ctx, P, w, h, o)
    case 'geometric': return drawGeometric(ctx, P, w, h)
    case 'ascii': return drawASCII(ctx, P, w, h)
    case 'mandala': return drawMandala(ctx, P, w, h)
    case 'wave': return drawWave(ctx, P, w, h)
  }
}

export const WATERMARK_TEXT = 'uuidwalls.vercel.app · KJR Labs'

export function drawWatermark(ctx: Ctx2D, w: number, h: number, P: UUIDParams) {
  const fs = Math.max(11, Math.min(16, w * 0.012))
  ctx.save()
  ctx.font = `${fs}px "IBM Plex Mono",monospace`
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'
  ctx.fillStyle = `hsla(${P.accent | 0},${P.sat | 0}%,80%,0.38)`
  ctx.fillText(WATERMARK_TEXT, w - fs, h - fs)
  ctx.restore()
}
