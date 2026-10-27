export function hsl(h: number, s: number, l: number, a?: number) {
  return a !== undefined ? `hsla(${h | 0},${s | 0}%,${l | 0}%,${a})` : `hsl(${h | 0},${s | 0}%,${l | 0}%)`
}

export function hslRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100
  if (!s) return [l * 255 | 0, l * 255 | 0, l * 255 | 0]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q
  const f = (p: number, q: number, t: number) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < .5) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p }
  return [f(p, q, h + 1 / 3) * 255 | 0, f(p, q, h) * 255 | 0, f(p, q, h - 1 / 3) * 255 | 0]
}
