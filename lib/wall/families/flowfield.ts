import { CHUNK_COLS, JITTER_SALT } from '../constants'
import { hsl } from '../color'
import { mkNoise } from '../noise'
import { mkPRNG } from '../prng'
import type { Ctx2D, DrawOptions, UUIDParams } from '../types'

// Port of v1 drawFlowFieldChunked. Order of draw calls and property writes is part of the output
// (strokes overlap with alpha), so strokes are NOT batched and the 12-column chunk grouping is kept.
// The only intentional change: the start jitter comes from a seeded PRNG instead of Math.random
// (v1 produced a slightly different wall on every render).
export async function drawFlowField(ctx: Ctx2D, P: UUIDParams, w: number, h: number, o: DrawOptions) {
  const { hue, sat, lum1, lum2, accent, density, angle, mood, seed } = P
  const n = mkNoise(seed)
  const rand = o.rand ?? mkPRNG((seed ^ JITTER_SALT) >>> 0)
  ctx.fillStyle = hsl(hue, sat * 0.3, lum2 * 0.5); ctx.fillRect(0, 0, w, h)
  const step = Math.max(5, 16 - density * 12)
  const iters = Math.floor(50 + mood * 90)
  const sc = 0.0022 + density * 0.002
  ctx.lineWidth = 0.7 + (1 - mood) * 1.5; ctx.lineCap = 'round'
  const xs: number[] = []; for (let x = 0; x < w; x += step) xs.push(x)
  for (let xi = 0; xi < xs.length;) {
    const end = Math.min(xi + CHUNK_COLS, xs.length)
    for (let i = xi; i < end; i++) {
      const x = xs[i]
      for (let y = 0; y < h; y += step) {
        let cx = x + (rand() - .5) * step * .4, cy = y + (rand() - .5) * step * .4
        const isAcc = ((x / step | 0) + (y / step | 0)) % 9 === 0
        const lh = isAcc ? accent : hue + (n(x * .001, y * .001) * 28)
        const lm = lum2 + (lum1 - lum2) * (x / w * .5 + y / h * .5)
        ctx.globalAlpha = 0.4 + mood * 0.45; ctx.strokeStyle = hsl(lh, sat, lm)
        ctx.beginPath(); ctx.moveTo(cx, cy)
        for (let k = 0; k < iters; k++) {
          const v = n(cx * sc, cy * sc) * Math.PI * 4 + angle
          cx += Math.cos(v) * 2.2; cy += Math.sin(v) * 2.2
          if (cx < 0 || cx > w || cy < 0 || cy > h) break
          ctx.lineTo(cx, cy)
        }
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1; xi = end
    await o.checkpoint?.(xi / xs.length)
  }
}
