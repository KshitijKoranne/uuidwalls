import { hsl } from '../color'
import { mkNoise } from '../noise'
import type { Ctx2D, UUIDParams } from '../types'

/** Font the ASCII wall is drawn with. Self-hosted in public/fonts and loaded into the worker. */
export const ASCII_FONT_FAMILY = 'IBM Plex Mono'

export function drawASCII(ctx: Ctx2D, P: UUIDParams, w: number, h: number) {
  const { hue, sat, lum1, lum2, accent, density, angle, seed } = P
  const n = mkNoise(seed)
  const chars = '@#%&$*+=:·. '
  const fs = Math.max(8, Math.floor(15 - density * 6))
  ctx.fillStyle = hsl(hue, sat * .3, lum2 * .4); ctx.fillRect(0, 0, w, h)
  ctx.font = `${fs}px "${ASCII_FONT_FAMILY}",monospace`; ctx.textBaseline = 'top'
  const sc = 0.004 + density * .003
  const cw = fs * .62, rh = fs * 1.1
  const nc = Math.ceil(w / cw) + 1, nr = Math.ceil(h / rh) + 1
  for (let row = 0; row < nr; row++) {
    for (let col = 0; col < nc; col++) {
      const px = col * cw, py = row * rh
      const nx = (px * Math.cos(angle) + py * Math.sin(angle)) * sc
      const ny = (-px * Math.sin(angle) + py * Math.cos(angle)) * sc
      const v1 = (n(nx, ny) + 1) / 2, v2 = (n(nx * 2.1 + 3.7, ny * 2.1 + 1.3) + 1) / 2
      const v = v1 * .7 + v2 * .3
      const ch = chars[Math.min(chars.length - 1, Math.floor(v * chars.length))]
      if (ch === ' ') continue
      const isAcc = (col * 5 + row * 7) % 17 === 0
      ctx.fillStyle = hsl(isAcc ? accent : hue + (v * 30), sat, lum2 + (lum1 - lum2) * v, 0.5 + v * .5)
      ctx.fillText(ch, px, py)
    }
  }
}
