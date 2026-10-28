import { CHUNK_ROWS } from '../constants'
import { hsl, hslRgb } from '../color'
import { mkPRNG } from '../prng'
import type { Ctx2D, DrawOptions, UUIDParams } from '../types'

// Port of v1 drawVoronoiChunked. Same arithmetic in the same order (Float64, so results are
// bit-identical). Differences from v1, none visible in the output: the image is uploaded once at
// the end instead of after every chunk (v1 copied the whole 33 MB buffer about 90 times at 4K),
// and point coordinates live in typed arrays.
export async function drawVoronoi(ctx: Ctx2D, P: UUIDParams, w: number, h: number, o: DrawOptions) {
  const { hue, sat, lum1, lum2, accent, density, mood, seed } = P
  const rng = mkPRNG(seed)
  const count = Math.floor(10 + density * 35)
  const px_ = new Float64Array(count), py_ = new Float64Array(count)
  for (let i = 0; i < count; i++) { px_[i] = rng() * w; py_[i] = rng() * h }
  const cols: [number, number, number][] = []
  for (let i = 0; i < count; i++) cols.push(hslRgb(i % 5 === 0 ? accent : hue + (i % 4) * 18, sat, lum2 + (i / count) * (lum1 - lum2)))
  const img = ctx.createImageData(w, h); const d = img.data
  // hq=true: pixel-perfect (hero/download). hq=false: coarse step for thumbnails
  const pxStep = o.hq ? 1 : Math.max(2, w / 240 | 0)
  const totalRows = Math.ceil(h / pxStep)
  const f = mood * .5 + .5
  for (let row = 0; row < totalRows;) {
    const endRow = Math.min(row + CHUNK_ROWS * 2, totalRows)
    for (let ri = row; ri < endRow; ri++) {
      const py = ri * pxStep
      for (let px = 0; px < w; px += pxStep) {
        let d1 = Infinity, d2 = Infinity, cl = 0
        for (let k = 0; k < count; k++) {
          const dx = px - px_[k], dy = py - py_[k], dist = dx * dx + dy * dy
          if (dist < d1) { d2 = d1; d1 = dist; cl = k } else if (dist < d2) d2 = dist
        }
        const edge = Math.min(1, (Math.sqrt(d2) - Math.sqrt(d1)) * .1)
        const [r, g, b] = cols[cl]
        const rv = Math.min(255, r * f + edge * 28 | 0), gv = Math.min(255, g * f + edge * 28 | 0), bv = Math.min(255, b * f + edge * 28 | 0)
        for (let dy2 = 0; dy2 < pxStep && py + dy2 < h; dy2++)
          for (let dx2 = 0; dx2 < pxStep && px + dx2 < w; dx2++) {
            const idx = ((py + dy2) * w + (px + dx2)) * 4
            d[idx] = rv; d[idx + 1] = gv; d[idx + 2] = bv; d[idx + 3] = 255
          }
      }
    }
    row = endRow
    await o.checkpoint?.(row / totalRows)
  }
  ctx.putImageData(img, 0, 0)
  for (let i = 0; i < count; i++) { ctx.beginPath(); ctx.arc(px_[i], py_[i], 1.5, 0, Math.PI * 2); ctx.fillStyle = hsl(accent, sat, lum1, .8); ctx.fill() }
}
