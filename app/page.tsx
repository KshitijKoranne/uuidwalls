'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import AuthModal from '@/components/AuthModal'
import PayModal from '@/components/PayModal'

// ─── TYPES ───
interface UUIDParams {
  family: string; hue: number; sat: number; lum1: number; lum2: number;
  accent: number; density: number; angle: number; mood: number; seed: number;
}
type DlSizeKey = 'screen' | '2k' | '4k' | 'mobile'

// ─── CONSTANTS ───
const HERO_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const CHUNK_ROWS = 12
const FAM_LABEL: Record<string, string> = {
  flowfield: 'Flow Field', voronoi: 'Voronoi', geometric: 'Geometric',
  ascii: 'ASCII', mandala: 'Mandala', wave: 'Wave',
}
const FAMS = ['flowfield', 'voronoi', 'geometric', 'ascii', 'mandala', 'wave']

const SC = [
  { uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', fam: 'flowfield', pal: { hue: 215, sat: 72, lum1: 74, lum2: 16, accent: 42 } },
  { uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', fam: 'voronoi', pal: { hue: 342, sat: 65, lum1: 72, lum2: 14, accent: 195 } },
  { uuid: 'deadbeef-cafe-4abe-b00d-123456789abc', fam: 'geometric', pal: { hue: 145, sat: 58, lum1: 70, lum2: 15, accent: 275 } },
  { uuid: '1a2b3c4d-5e6f-4789-9abc-def012345678', fam: 'ascii', pal: { hue: 28, sat: 60, lum1: 68, lum2: 12, accent: 200 } },
  { uuid: '9f8e7d6c-5b4a-4392-8170-0f1e2d3c4b5a', fam: 'mandala', pal: { hue: 260, sat: 65, lum1: 72, lum2: 14, accent: 45 } },
  { uuid: 'c0ffee00-1337-4abc-def0-123456789abc', fam: 'wave', pal: { hue: 185, sat: 62, lum1: 70, lum2: 16, accent: 340 } },
]

const GDATA = [
  { uuid: '550e8400-e29b-41d4-a716-446655440000', fam: 'voronoi', pal: { hue: 280, sat: 60, lum1: 68, lum2: 14, accent: 160 } },
  { uuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', fam: 'flowfield', pal: { hue: 195, sat: 70, lum1: 72, lum2: 18, accent: 30 } },
  { uuid: '7c9e6679-7425-40de-944b-e07fc1f90ae7', fam: 'geometric', pal: { hue: 355, sat: 65, lum1: 70, lum2: 15, accent: 200 } },
  { uuid: '9c858900-8a4d-11d1-8f14-001b62e03e77', fam: 'ascii', pal: { hue: 120, sat: 55, lum1: 65, lum2: 12, accent: 300 } },
  { uuid: '3d813cbb-47fb-32ba-91df-831e1593ac29', fam: 'flowfield', pal: { hue: 35, sat: 68, lum1: 75, lum2: 20, accent: 210 } },
  { uuid: 'b45a70b0-abad-4083-a8b5-cd7df9c4e342', fam: 'voronoi', pal: { hue: 260, sat: 62, lum1: 70, lum2: 16, accent: 80 } },
  { uuid: 'e9f77540-1be9-4432-8c29-c12b10ffb1f3', fam: 'geometric', pal: { hue: 170, sat: 58, lum1: 68, lum2: 13, accent: 320 } },
  { uuid: '4e56de08-d67e-4c5a-b0e8-3c1e2f4a5b6c', fam: 'ascii', pal: { hue: 45, sat: 64, lum1: 72, lum2: 18, accent: 230 } },
]

// ─── CANVAS ENGINE (verbatim port) ───
function mkPRNG(seed: number) {
  let s = seed >>> 0; if (!s) s = 2463534242
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }
}
function uuidSeed(uuid: string) {
  const c = uuid.replace(/-/g, '').toLowerCase(); let h = 2166136261
  for (let i = 0; i < c.length; i++) { h ^= c.charCodeAt(i); h = (h * 16777619) >>> 0 }
  return h
}
function parseUUID(uuid: string, forceFamily?: string): UUIDParams {
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
function hsl(h: number, s: number, l: number, a?: number) {
  return a !== undefined ? `hsla(${h | 0},${s | 0}%,${l | 0}%,${a})` : `hsl(${h | 0},${s | 0}%,${l | 0}%)`
}
function hslRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100
  if (!s) return [l * 255 | 0, l * 255 | 0, l * 255 | 0]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q
  const f = (p: number, q: number, t: number) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < .5) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p }
  return [f(p, q, h + 1 / 3) * 255 | 0, f(p, q, h) * 255 | 0, f(p, q, h - 1 / 3) * 255 | 0]
}
function mkNoise(seed: number) {
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

function drawFlowFieldChunked(canvas: HTMLCanvasElement, P: UUIDParams, w: number, h: number, onProgress: (r: number) => void, onDone: () => void) {
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

function drawVoronoiChunked(canvas: HTMLCanvasElement, P: UUIDParams, w: number, h: number, onProgress: (r: number) => void, onDone: () => void) {
  const ctx = canvas.getContext('2d')!; canvas.width = w; canvas.height = h
  const { hue, sat, lum1, lum2, accent, density, mood, seed } = P
  const rng = mkPRNG(seed)
  const count = Math.floor(10 + density * 35)
  const pts = Array.from({ length: count }, () => ({ x: rng() * w, y: rng() * h }))
  const cols = pts.map((_, i) => hslRgb(i % 5 === 0 ? accent : hue + (i % 4) * 18, sat, lum2 + (i / count) * (lum1 - lum2)))
  const img = ctx.createImageData(w, h); const d = img.data
  const pxStep = Math.max(2, w / 240 | 0)
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

function drawGeometric(canvas: HTMLCanvasElement, P: UUIDParams, w: number, h: number) {
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

function drawASCII(canvas: HTMLCanvasElement, P: UUIDParams, w: number, h: number) {
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

function drawMandala(canvas: HTMLCanvasElement, P: UUIDParams, w: number, h: number) {
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

function drawWave(canvas: HTMLCanvasElement, P: UUIDParams, w: number, h: number) {
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

function drawCanvas(canvas: HTMLCanvasElement, P: UUIDParams, w: number, h: number, onProgress: (r: number) => void, onDone: () => void) {
  if (!P) return
  if (P.family === 'geometric') { drawGeometric(canvas, P, w, h); onDone(); return }
  if (P.family === 'ascii') { drawASCII(canvas, P, w, h); onDone(); return }
  if (P.family === 'mandala') { drawMandala(canvas, P, w, h); onDone(); return }
  if (P.family === 'wave') { drawWave(canvas, P, w, h); onDone(); return }
  if (P.family === 'flowfield') { drawFlowFieldChunked(canvas, P, w, h, onProgress, onDone); return }
  if (P.family === 'voronoi') { drawVoronoiChunked(canvas, P, w, h, onProgress, onDone); return }
}

function applyWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, P: UUIDParams, enabled: boolean) {
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

// ─── MAIN COMPONENT ───
export default function Home() {
  const wallCanvasRef = useRef<HTMLCanvasElement>(null)
  const ctaCanvasRef = useRef<HTMLCanvasElement>(null)
  const [uuid, setUuid] = useState(HERO_UUID)
  const [family, setFamily] = useState('flowfield')
  const [metaText, setMetaText] = useState('Live · rendering')
  const [progress, setProgress] = useState(0)
  const [showProgress, setShowProgressState] = useState(false)
  const [dlMenuOpen, setDlMenuOpen] = useState(false)
  const [wmEnabled, setWmEnabled] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [galleryLoaded, setGalleryLoaded] = useState(0)
  const [galleryItems, setGalleryItems] = useState<typeof GDATA>([])
  const [exploreItems, setExploreItems] = useState<Array<{ uuid: string; fam: string }>>([])
  const renderTokenRef = useRef(0)
  const debTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── AUTH / PAYMENT STATE ───
  const [user, setUser] = useState<User | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [authTrigger, setAuthTrigger] = useState<'download' | 'unlock'>('download')

  const supabase = createClient()

  // ─── INIT AUTH ───
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase.from('paid_users').select('id').eq('user_id', user.id).single()
        setIsPaid(!!data)
      }
      setAuthChecked(true)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const { data } = await supabase.from('paid_users').select('id').eq('user_id', u.id).single()
        setIsPaid(!!data)
      } else {
        setIsPaid(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // ─── SHOW TOAST ───
  const showToast = useCallback((msg: string) => {
    setToast(msg); setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2400)
  }, [])

  // ─── HERO RENDER ───
  const applyHero = useCallback((uuid: string, fam: string, withProgress: boolean) => {
    const canvas = wallCanvasRef.current; if (!canvas) return
    renderTokenRef.current++
    const myToken = renderTokenRef.current
    setMetaText(`${FAM_LABEL[fam]} · rendering…`)
    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth, h = window.innerHeight
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
    const slow = fam === 'voronoi' || fam === 'flowfield'
    if (withProgress && slow) { setProgress(0); setShowProgressState(true) }
    drawCanvas(canvas, parseUUID(uuid, fam), w * dpr, h * dpr,
      (r) => setProgress(r),
      () => {
        if (myToken !== renderTokenRef.current) return
        if (withProgress && slow) setShowProgressState(false)
        setMetaText('Live · rendering')
      }
    )
  }, [])

  // ─── PERMALINK + PAYMENT CALLBACK ───
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    if (paymentStatus === 'success') {
      showToast('Payment successful! 2K & 4K downloads unlocked.')
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (user) {
          const { data } = await supabase.from('paid_users').select('id').eq('user_id', user.id).single()
          if (data) setIsPaid(true)
        }
      })
      history.replaceState(null, '', window.location.pathname)
    } else if (paymentStatus === 'cancelled') {
      showToast('Payment cancelled.')
      history.replaceState(null, '', window.location.pathname)
    } else if (paymentStatus === 'error') {
      showToast('Payment error. Please try again or contact support.')
      history.replaceState(null, '', window.location.pathname)
    }
    const pu = params.get('uuid'), pf = params.get('p')
    const initUUID = (pu && pu.replace(/-/g, '').length >= 8) ? pu : HERO_UUID
    const initFam = pf || 'flowfield'
    setUuid(initUUID); setFamily(initFam)
    setTimeout(() => applyHero(initUUID, initFam, false), 50)
    setTimeout(() => renderCTACanvas(), 250)
    setGalleryItems(GDATA.slice(0, 4)); setGalleryLoaded(4)
    shuffleExplore()
  }, [])

  // ─── RESIZE ───
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const handler = () => { clearTimeout(t); t = setTimeout(() => applyHero(uuid, family, false), 300) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [uuid, family, applyHero])

  function renderCTACanvas() {
    const c = ctaCanvasRef.current; if (!c) return
    const sec = c.parentElement!
    drawCanvas(c, { ...parseUUID('deadbeef-cafe-4abe-b00d-123456789abc'), family: 'flowfield', hue: 38, sat: 55, lum1: 72, lum2: 18, accent: 200, seed: uuidSeed('deadbeef') },
      sec.offsetWidth || 900, sec.offsetHeight || 500, () => { }, () => { })
  }

  function handleUUIDChange(val: string) {
    setUuid(val)
    if (debTimerRef.current) clearTimeout(debTimerRef.current)
    if (val.replace(/-/g, '').length < 8) return
    debTimerRef.current = setTimeout(() => {
      applyHero(val, family, false)
      const p = new URLSearchParams(); p.set('uuid', val); p.set('p', family)
      history.replaceState(null, '', '?' + p.toString())
    }, 420)
  }

  function handlePatternSwitch(fam: string) {
    setFamily(fam); applyHero(uuid, fam, true)
    const p = new URLSearchParams(); p.set('uuid', uuid); p.set('p', fam)
    history.replaceState(null, '', '?' + p.toString())
  }

  function randomUUID() {
    const u = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
    setUuid(u); applyHero(u, family, true)
  }

  // ─── DOWNLOAD ───
  function triggerDownload(sizeKey: DlSizeKey) {
    setDlMenuOpen(false)
    const isPremium = sizeKey === '2k' || sizeKey === '4k'

    if (isPremium && !isPaid) {
      if (!user) { setAuthTrigger('download'); setShowAuth(true) }
      else { setShowPay(true) }
      return
    }

    const sizes: Record<DlSizeKey, () => { w: number; h: number }> = {
      screen: () => ({ w: window.innerWidth * (window.devicePixelRatio || 1) | 0, h: window.innerHeight * (window.devicePixelRatio || 1) | 0 }),
      '2k': () => ({ w: 2560, h: 1440 }),
      '4k': () => ({ w: 3840, h: 2160 }),
      mobile: () => ({ w: 1290, h: 2796 }),
    }
    const { w, h } = sizes[sizeKey]()
    const offscreen = document.createElement('canvas')
    const P = parseUUID(uuid, family)

    try {
      drawCanvas(offscreen, P, w, h, () => { }, () => {
        const octx = offscreen.getContext('2d')!
        applyWatermark(octx, w, h, P, wmEnabled)
        offscreen.toBlob(blob => {
          if (!blob) { showToast('Could not generate image'); return }
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = `uuidwalls-${uuid.slice(0, 8)}-${family}-${sizeKey}.png`
          a.click(); setTimeout(() => URL.revokeObjectURL(url), 3000)
          showToast(`Downloading ${w}×${h}`)
        }, 'image/png')
      })
    } catch {
      showToast('Render failed — try a smaller size')
    }
  }

  function loadMoreGallery() {
    const next = GDATA.slice(galleryLoaded, galleryLoaded + 4)
    setGalleryItems(prev => [...prev, ...next])
    setGalleryLoaded(prev => prev + next.length)
  }

  function shuffleExplore() {
    const items = Array.from({ length: 6 }, () => ({
      uuid: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16) }),
      fam: FAMS[Math.floor(Math.random() * FAMS.length)],
    }))
    setExploreItems(items)
  }

  function loadCard(data: { uuid: string; fam: string }) {
    setUuid(data.uuid); setFamily(data.fam)
    applyHero(data.uuid, data.fam, true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function shareOnX() {
    const params = new URLSearchParams(); params.set('uuid', uuid); params.set('p', family)
    const link = `https://uuidwalls.vercel.app/?${params.toString()}`
    const txt = `Every device has a UUID no other machine on earth shares.\n\nMine generates a wall that belongs to no one else — mathematically, permanently.\n\nSee mine → ${link}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}`, '_blank', 'noopener')
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null); setIsPaid(false)
    showToast('Signed out')
  }

  function getMyUUID() {
    const ua = navigator.userAgent.toLowerCase()
    const isMac = ua.includes('mac') && !ua.includes('iphone') && !ua.includes('ipad')
    const isWin = ua.includes('win')
    const isLinux = ua.includes('linux') && !ua.includes('android')
    if (isMac) { navigator.clipboard.writeText("system_profiler SPHardwareDataType | grep 'Hardware UUID'").then(() => showToast('Terminal command copied')).catch(() => { }); return }
    if (isWin) { navigator.clipboard.writeText('wmic csproduct get UUID').then(() => showToast('Command copied')).catch(() => { }); return }
    if (isLinux) { navigator.clipboard.writeText('cat /etc/machine-id').then(() => showToast('Command copied')).catch(() => { }); return }
    showToast('Settings → General → About → UUID')
  }

  const dimScreen = typeof window !== 'undefined' ? `${window.innerWidth * (window.devicePixelRatio || 1) | 0}×${window.innerHeight * (window.devicePixelRatio || 1) | 0}` : 'screen'

  return (
    <>
      {/* ── MODALS ── */}
      {showAuth && <AuthModal trigger={authTrigger} onClose={() => setShowAuth(false)} />}
      {showPay && user && (
        <PayModal
          userEmail={user.email ?? ''}
          onClose={() => setShowPay(false)}
          onSuccess={() => { setIsPaid(true); setShowPay(false); showToast('Unlocked! 2K & 4K downloads are yours forever.') }}
        />
      )}

      {/* ── TOAST ── */}
      <div id="toast" style={{
        position: 'fixed', bottom: '2rem', left: '50%',
        transform: `translateX(-50%) translateY(${toastVisible ? '0' : '80px'})`,
        background: 'var(--paper)', color: 'var(--ink)', borderRadius: 'var(--r6)',
        padding: '11px 20px', fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 500,
        letterSpacing: '0.04em', zIndex: 999, transition: 'transform 0.35s cubic-bezier(.34,1.56,.64,1)',
        whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>{toast}</div>

      {/* ── PROGRESS ── */}
      {showProgress && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 201, background: 'rgba(10,9,8,0.82)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--p85)', letterSpacing: '0.1em', textAlign: 'center', lineHeight: 1.6 }}>Building your wall…<br /><span style={{ fontSize: '9px', opacity: 0.5 }}>This may take a moment</span></div>
          <div style={{ width: 240, height: 2, background: 'var(--p15)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--paper)', borderRadius: 2, width: `${progress * 100}%`, transition: 'width 0.12s linear' }} />
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--p30)', letterSpacing: '0.08em' }}>{(progress * 100).toFixed(0)}%</div>
        </div>
      )}

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', inset: '0 0 auto', zIndex: 100, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', background: 'rgba(10,9,8,0.75)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--p08)' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', letterSpacing: '-0.01em' }}>
          UUID<em style={{ fontStyle: 'italic', opacity: 0.55 }}>Walls</em>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {authChecked && (
            <>
              {isPaid && <span className="unlock-badge">2K/4K Unlocked</span>}
              {user ? (
                <button onClick={signOut} style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--p55)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}>
                  Sign out
                </button>
              ) : (
                <button onClick={() => { setAuthTrigger('unlock'); setShowAuth(true) }} style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--p55)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}>
                  Sign in
                </button>
              )}
              {!isPaid && (
                <button onClick={() => { if (!user) { setAuthTrigger('download'); setShowAuth(true) } else setShowPay(true) }}
                  style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--paper)', background: 'var(--p08)', border: '1px solid var(--p15)', borderRadius: 20, padding: '5px 14px', cursor: 'pointer', letterSpacing: '0.04em' }}>
                  Unlock 2K/4K · ₹99
                </button>
              )}
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="hero" style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 58 }}>
        <canvas ref={wallCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 70% at 50% 50%,rgba(10,9,8,0.05) 0%,rgba(10,9,8,0.6) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, pointerEvents: 'none', background: 'linear-gradient(transparent,var(--ink))' }} />

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '2rem 1.5rem', maxWidth: 760, width: '100%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: '1.75rem', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--p55)' }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--p55)', display: 'inline-block' }} />
            Generative · Deterministic · Private
          </div>

          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(3rem,8vw,6rem)', fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.025em', color: 'var(--paper)', marginBottom: '1.2rem', textShadow: '0 2px 48px rgba(10,9,8,0.85)' }}>
            Your device<br /><em style={{ fontStyle: 'italic', fontWeight: 400 }}>has a face.</em>
          </h1>

          <p style={{ fontSize: 'clamp(0.95rem,2vw,1.1rem)', fontWeight: 300, color: 'var(--p85)', lineHeight: 1.75, margin: '0 auto 2.25rem', maxWidth: 460, textShadow: '0 1px 16px rgba(10,9,8,0.9)' }}>
            Every device carries a UUID shared with no machine on earth. Enter yours — we render it into a wallpaper that belongs to no one else.
          </p>

          {/* GENERATOR CARD */}
          <div style={{ background: 'rgba(10,9,8,0.72)', border: '1px solid var(--p15)', borderRadius: 'var(--r14)', padding: '1.375rem 1.625rem 1.125rem', backdropFilter: 'blur(28px)', maxWidth: 620, margin: '0 auto', boxShadow: '0 8px 48px rgba(0,0,0,0.55)' }}>
            {/* Pattern switcher */}
            <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', overflowX: 'auto', paddingBottom: 2 }}>
              {FAMS.map(f => (
                <button key={f} onClick={() => handlePatternSwitch(f)} style={{
                  background: family === f ? 'var(--paper)' : 'var(--p05)',
                  border: `1px solid ${family === f ? 'var(--paper)' : 'var(--p15)'}`,
                  borderRadius: 20, padding: '6px 14px', fontFamily: 'var(--mono)', fontSize: '10px',
                  letterSpacing: '0.08em', color: family === f ? 'var(--ink)' : 'var(--p55)',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: family === f ? 500 : 400,
                  transition: 'all var(--ease)',
                }}>
                  {FAM_LABEL[f]}
                </button>
              ))}
            </div>

            {/* Input row */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', marginBottom: '0.875rem' }}>
              <input
                value={uuid}
                onChange={e => handleUUIDChange(e.target.value)}
                placeholder="Enter your device UUID…"
                style={{ flex: 1, background: 'var(--p05)', border: '1px solid var(--p15)', borderRadius: 'var(--r6)', padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--paper)', outline: 'none', minWidth: 0, letterSpacing: '0.04em' }}
              />
              <button onClick={randomUUID} style={{ background: 'transparent', border: '1px solid var(--p15)', borderRadius: 'var(--r6)', padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--p55)', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                ↻ Random
              </button>
            </div>

            {/* Action row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: '0.875rem', borderTop: '1px solid var(--p08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p55)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s ease-in-out infinite', display: 'inline-block' }} />
                {metaText}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={getMyUUID} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--p15)', borderRadius: 'var(--r6)', padding: '7px 13px', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.05em', color: 'var(--p55)', cursor: 'pointer' }}>
                  Get my UUID
                </button>

                {/* Watermark toggle */}
                <button onClick={() => setWmEnabled(w => !w)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--p15)', borderRadius: 'var(--r6)', padding: '7px 13px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p55)', cursor: 'pointer' }}>
                  Watermark: {wmEnabled ? 'On' : 'Off'}
                </button>

                {/* Download dropdown */}
                <div style={{ position: 'relative' }}>
                  <button onClick={(e) => { e.stopPropagation(); setDlMenuOpen(o => !o) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--p15)', borderRadius: 'var(--r6)', padding: '7px 13px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p55)', cursor: 'pointer' }}>
                    ↓ Download
                  </button>
                  {dlMenuOpen && (
                    <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, background: 'var(--ink2)', border: '1px solid var(--p15)', borderRadius: 'var(--r10)', padding: 6, minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 50 }}>
                      {([
                        { key: 'screen', label: 'Screen resolution', dim: dimScreen },
                        { key: 'mobile', label: 'Mobile', dim: '1290×2796' },
                        { key: '2k', label: `2K ${!isPaid ? '— unlock ₹99' : ''}`, dim: '2560×1440', premium: true },
                        { key: '4k', label: `4K ${!isPaid ? '— unlock ₹99' : ''}`, dim: '3840×2160', premium: true },
                      ] as Array<{ key: DlSizeKey; label: string; dim: string; premium?: boolean }>).map(opt => (
                        <div key={opt.key} onClick={() => triggerDownload(opt.key)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 'var(--r6)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '10px', color: opt.premium && !isPaid ? 'var(--p30)' : 'var(--p85)', gap: 16, whiteSpace: 'nowrap' }}>
                          <span style={{ letterSpacing: '0.04em' }}>{opt.label}</span>
                          <span style={{ color: 'var(--p30)', fontSize: 9 }}>{opt.dim}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '2.25rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, color: 'var(--p30)', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none"><path d="M6 0v12M1 8l5 6 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Scroll
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '7rem 1.5rem', background: 'var(--ink2)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--p30)', marginBottom: '1rem' }}>How it works</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.2rem,4.5vw,3.5rem)', fontWeight: 700, color: 'var(--paper)', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '0.875rem' }}>Mathematically yours.</h2>
          <p style={{ fontSize: '1rem', fontWeight: 300, color: 'var(--p85)', maxWidth: 520, lineHeight: 1.75, marginBottom: '3.5rem' }}>Your UUID is not random to us — it is the seed. Same input, same output. Always.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 1, background: 'var(--p08)', border: '1px solid var(--p08)', borderRadius: 'var(--r14)', overflow: 'hidden' }}>
            {[
              { n: '01', h: 'Find your UUID', p: 'Every device has one. Mac, Windows, Linux, iPhone, Android — each carries a UUID that is cryptographically unique.' },
              { n: '02', h: 'Enter & render', p: 'Paste it in. The algorithm maps every hex character to visual parameters — hue, density, angle, pattern family.' },
              { n: '03', h: 'Pick your pattern', p: 'Six families: Flow Field, Voronoi, Geometric, ASCII, Mandala, Wave. Same UUID, six different faces.' },
              { n: '04', h: 'Download your wall', p: 'Screen, mobile, 2K, or 4K. Renders locally — your UUID never leaves your browser.' },
            ].map(s => (
              <div key={s.n} style={{ background: 'var(--ink2)', padding: '2.25rem 1.75rem' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '4rem', fontWeight: 700, color: 'rgba(240,237,232,0.05)', lineHeight: 1, marginBottom: '1.25rem', letterSpacing: '-0.04em' }}>{s.n}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.6rem' }}>{s.h}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--p85)', lineHeight: 1.75, fontWeight: 300 }}>{s.p}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SHOWCASE ── */}
      <section style={{ padding: '7rem 1.5rem', background: 'var(--ink)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--p30)', marginBottom: '1rem' }}>Six families</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.2rem,4.5vw,3.5rem)', fontWeight: 700, color: 'var(--paper)', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '0.875rem' }}>Same UUID. Six faces.</h2>
          <p style={{ fontSize: '1rem', fontWeight: 300, color: 'var(--p85)', maxWidth: 520, lineHeight: 1.75, marginBottom: '3.5rem' }}>Every pattern family produces a completely different aesthetic from the same seed.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--p08)', border: '1px solid var(--p08)', borderRadius: 'var(--r14)', overflow: 'hidden' }}>
            {SC.map((d, i) => (
              <SmallCanvas key={d.fam} id={`sc${i}`} data={d} onClick={() => { setUuid(d.uuid); setFamily(d.fam); applyHero(d.uuid, d.fam, true); window.scrollTo({ top: 0, behavior: 'smooth' }) }} label={FAM_LABEL[d.fam]} />
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section style={{ padding: '7rem 1.5rem', background: 'var(--ink)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--p30)', marginBottom: '1rem' }}>Community walls</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.2rem,4.5vw,3.5rem)', fontWeight: 700, color: 'var(--paper)', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '0.875rem' }}>Walls from real machines</h2>
          <p style={{ fontSize: '1rem', fontWeight: 300, color: 'var(--p85)', maxWidth: 520, lineHeight: 1.75, marginBottom: '3.5rem' }}>Generated from real UUIDs. Click any to load it.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 10, marginBottom: '2rem' }}>
            {galleryItems.map(d => (
              <SmallCanvas key={d.uuid} id={`g-${d.uuid}`} data={d} onClick={() => loadCard(d)} label={FAM_LABEL[d.fam]} sub={d.uuid.slice(0, 8) + '…'} aspect="16/10" />
            ))}
          </div>
          {galleryLoaded < GDATA.length && (
            <div style={{ textAlign: 'center' }}>
              <button onClick={loadMoreGallery} style={{ background: 'transparent', border: '1px solid var(--p15)', borderRadius: 'var(--r6)', padding: '12px 28px', fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--p85)', cursor: 'pointer' }}>Load more walls</button>
            </div>
          )}
        </div>
      </section>

      {/* ── EXPLORE ── */}
      <section style={{ padding: '7rem 1.5rem', background: 'var(--ink3)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--p30)', marginBottom: '1rem' }}>Explore mode</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.2rem,4.5vw,3.5rem)', fontWeight: 700, color: 'var(--paper)', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '0.875rem' }}>Not sure where to start?</h2>
          <p style={{ fontSize: '1rem', fontWeight: 300, color: 'var(--p85)', maxWidth: 520, lineHeight: 1.75, marginBottom: '3.5rem' }}>Six random walls. Click any to load it — or shuffle again.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10, marginBottom: '1.5rem' }}>
            {exploreItems.map(d => (
              <SmallCanvas key={d.uuid} id={`ex-${d.uuid}`} data={d} onClick={() => loadCard(d)} label={FAM_LABEL[d.fam]} aspect="16/10" />
            ))}
          </div>
          <button onClick={shuffleExplore} style={{ background: 'transparent', border: '1px solid var(--p15)', borderRadius: 'var(--r6)', padding: '11px 22px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--p55)', cursor: 'pointer', letterSpacing: '0.06em' }}>
            ↻ Shuffle six new walls
          </button>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ padding: '7rem 1.5rem', background: 'var(--ink2)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--p30)', marginBottom: '1rem' }}>Pricing</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.2rem,4.5vw,3.5rem)', fontWeight: 700, color: 'var(--paper)', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '3rem' }}>Simple. One-time.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--p08)', border: '1px solid var(--p08)', borderRadius: 'var(--r14)', overflow: 'hidden', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--ink2)', padding: '2.5rem 2rem', textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--p30)', marginBottom: '0.75rem' }}>Free</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '1.5rem' }}>₹0</div>
              {['All 6 pattern families', 'Screen resolution download', 'Mobile resolution download', 'Permalink sharing', 'Watermark toggle'].map(f => (
                <div key={f} style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--p55)', padding: '5px 0', borderBottom: '1px solid var(--p08)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--p30)' }}>✓</span> {f}
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--ink3)', padding: '2.5rem 2rem', textAlign: 'left', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 20, padding: '3px 10px', fontFamily: 'var(--mono)', fontSize: '9px', color: '#4ade80' }}>Forever</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--p30)', marginBottom: '0.75rem' }}>Lifetime</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '1.5rem' }}>₹99</div>
              {['Everything in Free', '2K downloads (2560×1440)', '4K downloads (3840×2160)', 'Watermark-free export', 'All future resolutions'].map(f => (
                <div key={f} style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--p85)', padding: '5px 0', borderBottom: '1px solid var(--p08)', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#4ade80' }}>✓</span> {f}
                </div>
              ))}
              <button onClick={() => { if (!user) { setAuthTrigger('download'); setShowAuth(true) } else if (!isPaid) setShowPay(true) }}
                style={{ marginTop: '1.5rem', width: '100%', background: 'var(--paper)', color: 'var(--ink)', border: 'none', borderRadius: 'var(--r6)', padding: '13px 20px', fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 500, cursor: isPaid ? 'default' : 'pointer', opacity: isPaid ? 0.5 : 1 }}>
                {isPaid ? 'Already unlocked' : 'Unlock for ₹99'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '7rem 1.5rem', background: 'var(--ink2)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--p30)', marginBottom: '1rem' }}>Questions</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.2rem,4.5vw,3.5rem)', fontWeight: 700, color: 'var(--paper)', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '3rem' }}>Honest answers</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--p08)', border: '1px solid var(--p08)', borderRadius: 'var(--r14)', overflow: 'hidden' }}>
            {[
              { q: 'Does this send my UUID anywhere?', a: 'No. Everything runs in your browser. Your UUID is never transmitted. There is no backend, no analytics on your input.' },
              { q: 'What resolution will my wallpaper be?', a: 'You choose. Screen res matches your display. 2K exports at 2560×1440. 4K at 3840×2160. Mobile at 1290×2796.' },
              { q: 'Can two machines get the same wall?', a: 'Only if they share a UUID — cryptographically impossible by design. Your wall is provably yours.' },
              { q: 'Will my wall look the same next year?', a: 'Yes. The algorithm is deterministic and versioned. Same UUID, same result, always.' },
              { q: 'What does the ₹99 unlock?', a: '2K and 4K resolution downloads, permanently, for your account. Screen and mobile downloads remain free forever.' },
              { q: 'Is a native app coming?', a: 'Yes. Native apps will read your UUID automatically and set the wallpaper with one tap. Web first, apps soon.' },
            ].map(({ q, a }) => (
              <div key={q} style={{ background: 'var(--ink2)', padding: '2rem 1.75rem' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.5rem' }}>{q}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 300, color: 'var(--p85)', lineHeight: 1.75 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'var(--ink2)', position: 'relative', overflow: 'hidden', textAlign: 'center', padding: '8rem 1.5rem' }}>
        <canvas ref={ctaCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1 }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.5rem,6vw,5rem)', fontWeight: 700, color: 'var(--paper)', letterSpacing: '-0.025em', lineHeight: 1.05, marginBottom: '1rem' }}>
            What does your<br /><em style={{ fontStyle: 'italic', fontWeight: 400 }}>device look like?</em>
          </h2>
          <p style={{ fontSize: '1rem', fontWeight: 300, color: 'var(--p85)', marginBottom: '2.5rem' }}>No install. Enter your UUID, pick your pattern, download your wall.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: 'var(--paper)', color: 'var(--ink)', border: 'none', borderRadius: 'var(--r6)', padding: '16px 32px', fontFamily: 'var(--sans)', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}>
              Generate my wall
            </button>
            <button onClick={shareOnX} style={{ background: 'transparent', color: 'var(--p85)', border: '1px solid var(--p15)', borderRadius: 'var(--r6)', padding: '16px 24px', fontFamily: 'var(--sans)', fontSize: '15px', fontWeight: 400, cursor: 'pointer' }}>
              Share on X
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--ink)', borderTop: '1px solid var(--p08)', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--paper)' }}>UUIDWalls</div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <a href="mailto:kjrlabs9@gmail.com" style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p30)', textDecoration: 'none', letterSpacing: '0.06em' }}>Contact</a>
          <a href="https://kjrlabs.in" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p30)', textDecoration: 'none', letterSpacing: '0.06em' }}>KJR Labs</a>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p55)', letterSpacing: '0.04em' }}>Deterministic · Private · Universal</div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
      `}</style>
    </>
  )
}

// ─── SMALL CANVAS CARD COMPONENT ───
function SmallCanvas({ id, data, onClick, label, sub, aspect = '4/3' }: {
  id: string
  data: { uuid: string; fam: string; pal?: Record<string, number> }
  onClick: () => void
  label: string
  sub?: string
  aspect?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendered = useRef(false)

  useEffect(() => {
    if (rendered.current) return
    const canvas = canvasRef.current; if (!canvas) return
    const timer = setTimeout(() => {
      const w = Math.max(canvas.parentElement?.offsetWidth || 240, 240)
      const h = Math.max(canvas.parentElement?.offsetHeight || 160, 160)
      const P = data.pal
        ? { ...parseUUID(data.uuid), ...data.pal, family: data.fam, seed: uuidSeed(data.uuid) }
        : parseUUID(data.uuid, data.fam)
      drawCanvas(canvas, P, w, h, () => { }, () => { })
      rendered.current = true
    }, 60)
    return () => clearTimeout(timer)
  }, [data])

  return (
    <div onClick={onClick} style={{ position: 'relative', overflow: 'hidden', aspectRatio: aspect, cursor: 'pointer', background: 'var(--ink2)', transition: 'transform 0.3s ease' }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(10,9,8,0.92))', padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {sub && <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--p30)', letterSpacing: '0.04em', marginBottom: 3 }}>{sub}</div>}
        <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--paper)' }}>{label}</div>
      </div>
    </div>
  )
}
