import { hsl } from '../color'
import { mkPRNG } from '../prng'
import type { Ctx2D, UUIDParams } from '../types'

export function drawGeometric(ctx: Ctx2D, P: UUIDParams, w: number, h: number) {
  const { hue, sat, lum1, lum2, accent, density, angle, mood, seed } = P
  const rng = mkPRNG(seed)
  ctx.fillStyle = hsl(hue, sat * .4, lum2 * .5); ctx.fillRect(0, 0, w, h)
  ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(angle); ctx.translate(-w / 2, -h / 2)
  const cs = Math.max(18, 72 - density * 50)
  const cols = Math.ceil(w / cs) + 3, rows = Math.ceil(h / cs) + 3
  const sh = Math.floor(rng() * 3)
  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const cx = col * cs + (row % 2 === 0 ? 0 : cs * .5), cy = row * cs * .866
      const lm = lum2 + (lum1 - lum2) * ((col / cols + row / rows) / 2)
      const isAcc = (col * 3 + row * 7) % 13 === 0
      const fh = isAcc ? accent : hue + rng() * 22 - 11
      ctx.fillStyle = hsl(fh, sat, lm, .25 + rng() * .6)
      ctx.strokeStyle = hsl(fh, sat * .4, lum1, .1); ctx.lineWidth = .5
      const r = cs * (.41 + mood * .09)
      ctx.beginPath()
      if (sh === 0) { ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * .866, cy + r * .5); ctx.lineTo(cx - r * .866, cy + r * .5) }
      else if (sh === 1) { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 - Math.PI / 6; if (i) ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); else ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) } }
      else { ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * .6, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * .6, cy) }
      ctx.closePath(); ctx.fill(); ctx.stroke()
    }
  }
  ctx.restore()
}
