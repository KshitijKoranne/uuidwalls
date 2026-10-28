import { hsl } from '../color'
import { mkPRNG } from '../prng'
import type { Ctx2D, UUIDParams } from '../types'

export function drawMandala(ctx: Ctx2D, P: UUIDParams, w: number, h: number) {
  const { hue, sat, lum1, lum2, accent, density, mood, seed } = P
  const rng = mkPRNG(seed)
  ctx.fillStyle = hsl(hue, sat * 0.25, lum2 * 0.45); ctx.fillRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  const rings = Math.floor(5 + density * 10)
  const spokeBase = Math.floor(6 + rng() * 6) * 2
  const maxR = Math.min(w, h) * 0.48
  for (let ring = rings; ring >= 1; ring--) {
    const r = maxR * (ring / rings)
    const spokes = spokeBase + (ring % 3 === 0 ? spokeBase : 0)
    const t = ring / rings
    const isAccRing = ring % 3 === 0
    const ringHue = isAccRing ? accent : hue + (ring * 12)
    const lm = lum2 + (lum1 - lum2) * (1 - t)
    for (let s = 0; s < spokes; s++) {
      const a0 = s * (Math.PI * 2 / spokes)
      const a1 = (s + 0.5) * (Math.PI * 2 / spokes)
      const r0 = r * (0.55 + mood * 0.1)
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0)
      ctx.lineTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r)
      ctx.arc(cx, cy, r, a0, a1); ctx.closePath()
      ctx.fillStyle = hsl(ringHue, sat, lm, 0.3 + t * 0.45); ctx.fill()
      ctx.strokeStyle = hsl(ringHue, sat, lum1, 0.15 + t * 0.2); ctx.lineWidth = 0.5; ctx.stroke()
    }
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = hsl(ringHue, sat * 0.5, lum1, 0.12); ctx.lineWidth = 0.5; ctx.stroke()
  }
  ctx.beginPath(); ctx.arc(cx, cy, maxR * 0.025, 0, Math.PI * 2)
  ctx.fillStyle = hsl(accent, sat, lum1, 0.9); ctx.fill()
}
