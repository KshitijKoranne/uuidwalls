import { hsl } from '../color'
import { mkPRNG } from '../prng'
import type { Ctx2D, UUIDParams } from '../types'

export function drawWave(ctx: Ctx2D, P: UUIDParams, w: number, h: number) {
  const { hue, sat, lum1, lum2, accent, density, angle, mood, seed } = P
  const rng = mkPRNG(seed)
  ctx.fillStyle = hsl(hue, sat * 0.28, lum2 * 0.5); ctx.fillRect(0, 0, w, h)
  const bands = Math.floor(6 + density * 16)
  const freq1 = 0.004 + rng() * 0.008, freq2 = 0.003 + rng() * 0.006, freq3 = 0.005 + rng() * 0.004
  const amp = h / (bands * 1.8), bandH = h / bands
  for (let b = 0; b < bands; b++) {
    const t = b / bands; const isAcc = b % 4 === 0
    const bHue = isAcc ? accent : hue + (b * 15) % 60 - 30
    const lm = lum2 + (lum1 - lum2) * t; const yBase = b * bandH
    ctx.beginPath(); ctx.moveTo(0, yBase)
    for (let x = 0; x <= w; x += 2) {
      const phase = angle + b * 0.7
      const y = yBase + Math.sin(x * freq1 + phase) * amp + Math.sin(x * freq2 + phase * 1.3) * amp * 0.5 + Math.sin(x * freq3 + phase * 0.7) * amp * 0.25
      ctx.lineTo(x, y)
    }
    ctx.lineTo(w, yBase + bandH * 2); ctx.lineTo(0, yBase + bandH * 2); ctx.closePath()
    ctx.fillStyle = hsl(bHue, sat, lm, 0.35 + mood * 0.35); ctx.fill()
    ctx.beginPath(); ctx.moveTo(0, yBase)
    for (let x = 0; x <= w; x += 2) {
      const phase = angle + b * 0.7
      const y = yBase + Math.sin(x * freq1 + phase) * amp + Math.sin(x * freq2 + phase * 1.3) * amp * 0.5 + Math.sin(x * freq3 + phase * 0.7) * amp * 0.25
      ctx.lineTo(x, y)
    }
    ctx.strokeStyle = hsl(bHue, sat, lum1, 0.3 + t * 0.3); ctx.lineWidth = 1 + mood; ctx.stroke()
  }
}
