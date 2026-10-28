// DO NOT EDIT. Verbatim copy of the v1 engine from main@22d6f4b (app/page.tsx lines 47-317).
// It is the reference the golden hashes are generated from. Only change: `export` added to declarations
// and the two types/constants it needs declared at the top.
export interface UUIDParams {
  family: string; hue: number; sat: number; lum1: number; lum2: number;
  accent: number; density: number; angle: number; mood: number; seed: number;
}
const CHUNK_ROWS = 12

export function mkPRNG(seed: number) {
  let s = seed >>> 0; if (!s) s = 2463534242
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }
}
export function uuidSeed(uuid: string) {
  const c = uuid.replace(/-/g, '').toLowerCase(); let h = 2166136261
  for (let i = 0; i < c.length; i++) { h ^= c.charCodeAt(i); h = (h * 16777619) >>> 0 }
  return h
}
export function parseUUID(uuid: string, forceFamily?: string): UUIDParams {
  const clean = uuid.trim().replace(/-/g, '').toLowerCase().replace(/[^0-9a-f]/g, '').padEnd(32, '0').slice(0, 32)
  const s = (o: number, l: number) => parseInt(clean.slice(o, o + l), 16) || 0
  const fams = ['flowfield', 'voronoi', 'geometric', 'ascii', 'mandala', 'wave']
  const fi = forceFamily ? fams.indexOf(forceFamily) : s(0, 4) % 6
  return {
    family: fams[Math.max(0, fi)], hue: s(4, 4) % 360, sat: 50 + s(8, 4) % 35,
    lum1: 55 + s(12, 4) % 28, lum2: 14 + s(16, 4) % 18,
    accent: (s(4, 4) % 360 + 100 + s(20, 4) % 100) % 360,
    density: 0.3 + s(24, 4) % 1000 / 1000 * 0.7,
    angle: s(28, 4) % 360 * Math.PI / 180, mood: s(0, 2) % 100 / 100, seed: uuidSeed(uuid),
  }
}
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
export function mkNoise(seed: number) {
  const perm = new Uint8Array(512), p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  let s = seed >>> 0
  const r = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }
  for (let i = 255; i > 0; i--) { const j = r() * i | 0; const t = p[i]; p[i] = p[j]; p[j] = t }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
  const g = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]
  const dot = (g: number[], x: number, y: number) => g[0] * x + g[1] * y
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
  const lerp = (a: number, b: number, t: number) => a + t * (b - a)
  return (x: number, y: number) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255
    x -= Math.floor(x); y -= Math.floor(y)
    const u = fade(x), v = fade(y), a = perm[X] + Y, b = perm[X + 1] + Y
    return lerp(lerp(dot(g[perm[a] % 8], x, y), dot(g[perm[b] % 8], x - 1, y), u),
      lerp(dot(g[perm[a + 1] % 8], x, y - 1), dot(g[perm[b + 1] % 8], x - 1, y - 1), u), v)
  }
}

export function drawFlowFieldChunked(canvas: HTMLCanvasElement, P: UUIDParams, w: number, h: number, onProgress: (r: number) => void, onDone: () => void) {
  const ctx = canvas.getContext('2d')!; canvas.width = w; canvas.height = h
  const { hue, sat, lum1, lum2, accent, density, angle, mood, seed } = P
  const n = mkNoise(seed)
  ctx.fillStyle = hsl(hue, sat * 0.3, lum2 * 0.5); ctx.fillRect(0, 0, w, h)
  const step = Math.max(5, 16 - density * 12)
  const iters = Math.floor(50 + mood * 90)
  const sc = 0.0022 + density * 0.002
  ctx.lineWidth = 0.7 + (1 - mood) * 1.5; ctx.lineCap = 'round'
  const xs: number[] = []; for (let x = 0; x < w; x += step) xs.push(x)
  let xi = 0
  function chunk() {
    const end = Math.min(xi + CHUNK_ROWS, xs.length)
    for (let i = xi; i < end; i++) {
      const x = xs[i]
      for (let y = 0; y < h; y += step) {
        let cx = x + (Math.random() - .5) * step * .4, cy = y + (Math.random() - .5) * step * .4
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
    ctx.globalAlpha = 1; xi = end; onProgress(xi / xs.length)
    if (xi < xs.length) requestAnimationFrame(chunk); else onDone()
  }
  requestAnimationFrame(chunk)
}

export function drawVoronoiChunked(canvas: HTMLCanvasElement, P: UUIDParams, w: number, h: number, onProgress: (r: number) => void, onDone: () => void, hq = false) {
  const ctx = canvas.getContext('2d')!; canvas.width = w; canvas.height = h
  const { hue, sat, lum1, lum2, accent, density, mood, seed } = P
  const rng = mkPRNG(seed)
  const count = Math.floor(10 + density * 35)
  const pts = Array.from({ length: count }, () => ({ x: rng() * w, y: rng() * h }))
  const cols = pts.map((_, i) => hslRgb(i % 5 === 0 ? accent : hue + (i % 4) * 18, sat, lum2 + (i / count) * (lum1 - lum2)))
  const img = ctx.createImageData(w, h); const d = img.data
  // hq=true: pixel-perfect (hero/download). hq=false: coarse step for thumbnails
  const pxStep = hq ? 1 : Math.max(2, w / 240 | 0)
  const totalRows = Math.ceil(h / pxStep); let row = 0
  function chunk() {
    const endRow = Math.min(row + CHUNK_ROWS * 2, totalRows)
    for (let ri = row; ri < endRow; ri++) {
      const py = ri * pxStep
      for (let px = 0; px < w; px += pxStep) {
        let d1 = Infinity, d2 = Infinity, cl = 0
        for (let k = 0; k < pts.length; k++) {
          const dx = px - pts[k].x, dy = py - pts[k].y, dist = dx * dx + dy * dy
          if (dist < d1) { d2 = d1; d1 = dist; cl = k } else if (dist < d2) d2 = dist
        }
        const edge = Math.min(1, (Math.sqrt(d2) - Math.sqrt(d1)) * .1)
        const [r, g, b] = cols[cl]; const f = mood * .5 + .5
        const rv = Math.min(255, r * f + edge * 28 | 0), gv = Math.min(255, g * f + edge * 28 | 0), bv = Math.min(255, b * f + edge * 28 | 0)
        for (let dy2 = 0; dy2 < pxStep && py + dy2 < h; dy2++)
          for (let dx2 = 0; dx2 < pxStep && px + dx2 < w; dx2++) {
            const idx = ((py + dy2) * w + (px + dx2)) * 4
            d[idx] = rv; d[idx + 1] = gv; d[idx + 2] = bv; d[idx + 3] = 255
          }
      }
    }
    ctx.putImageData(img, 0, 0); row = endRow; onProgress(row / totalRows)
    if (row < totalRows) requestAnimationFrame(chunk)
    else {
      for (const pt of pts) { ctx.beginPath(); ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2); ctx.fillStyle = hsl(accent, sat, lum1, .8); ctx.fill() }
      onDone()
    }
  }
  requestAnimationFrame(chunk)
}

export function drawGeometric(canvas: HTMLCanvasElement, P: UUIDParams, w: number, h: number) {
  const ctx = canvas.getContext('2d')!; canvas.width = w; canvas.height = h
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
      else if (sh === 1) { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 - Math.PI / 6; i ? ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) : ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) } }
      else { ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * .6, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * .6, cy) }
      ctx.closePath(); ctx.fill(); ctx.stroke()
    }
  }
  ctx.restore()
}

export function drawASCII(canvas: HTMLCanvasElement, P: UUIDParams, w: number, h: number) {
  const ctx = canvas.getContext('2d')!; canvas.width = w; canvas.height = h
  const { hue, sat, lum1, lum2, accent, density, angle, mood, seed } = P
  const n = mkNoise(seed)
  const chars = '@#%&$*+=:·. '
  const fs = Math.max(8, Math.floor(15 - density * 6))
  ctx.fillStyle = hsl(hue, sat * .3, lum2 * .4); ctx.fillRect(0, 0, w, h)
  ctx.font = `${fs}px "IBM Plex Mono",monospace`; ctx.textBaseline = 'top'
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

export function drawMandala(canvas: HTMLCanvasElement, P: UUIDParams, w: number, h: number) {
  const ctx = canvas.getContext('2d')!; canvas.width = w; canvas.height = h
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

export function drawWave(canvas: HTMLCanvasElement, P: UUIDParams, w: number, h: number) {
  const ctx = canvas.getContext('2d')!; canvas.width = w; canvas.height = h
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

export function drawCanvas(canvas: HTMLCanvasElement, P: UUIDParams, w: number, h: number, onProgress: (r: number) => void, onDone: () => void, hq = false) {
  if (!P) return
  if (P.family === 'geometric') { drawGeometric(canvas, P, w, h); onDone(); return }
  if (P.family === 'ascii') { drawASCII(canvas, P, w, h); onDone(); return }
  if (P.family === 'mandala') { drawMandala(canvas, P, w, h); onDone(); return }
  if (P.family === 'wave') { drawWave(canvas, P, w, h); onDone(); return }
  if (P.family === 'flowfield') { drawFlowFieldChunked(canvas, P, w, h, onProgress, onDone); return }
  if (P.family === 'voronoi') { drawVoronoiChunked(canvas, P, w, h, onProgress, onDone, hq); return }
}

export function applyWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, P: UUIDParams, enabled: boolean) {
  if (!enabled) return
  const text = 'uuidwalls.vercel.app · KJR Labs'
  const fs = Math.max(11, Math.min(16, w * 0.012))
  ctx.save()
  ctx.font = `${fs}px "IBM Plex Mono",monospace`
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'
  ctx.fillStyle = `hsla(${P.accent | 0},${P.sat | 0}%,80%,0.38)`
  ctx.fillText(text, w - fs, h - fs)
  ctx.restore()
}
