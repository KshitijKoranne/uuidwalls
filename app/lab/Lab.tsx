'use client'

import { useEffect } from 'react'
import { drawWall, parseUUID } from '@/lib/wall'
import { isAbort, wallRenderer } from '@/lib/wall/client'
import { ensureMonoFont } from '@/lib/wall/fonts'

type Mode = 'worker' | 'main' | 'v1'
interface Req { uuid: string; fam: string; w: number; h: number; hq?: boolean }

async function hashPixels(canvas: HTMLCanvasElement) {
  const tmp = document.createElement('canvas'); tmp.width = canvas.width; tmp.height = canvas.height
  const t = tmp.getContext('2d')!; t.drawImage(canvas, 0, 0)
  const data = t.getImageData(0, 0, tmp.width, tmp.height).data
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24)
}

async function pixels(canvas: HTMLCanvasElement) {
  const tmp = document.createElement('canvas'); tmp.width = canvas.width; tmp.height = canvas.height
  const t = tmp.getContext('2d')!; t.drawImage(canvas, 0, 0)
  return t.getImageData(0, 0, tmp.width, tmp.height).data
}

function longTasks() {
  const tasks: number[] = []
  const po = new PerformanceObserver(list => { for (const e of list.getEntries()) tasks.push(e.duration) })
  po.observe({ type: 'longtask', buffered: false })
  return { stop: () => { po.disconnect(); return tasks } }
}

async function render(mode: Mode, r: Req) {
  const P = parseUUID(r.uuid, r.fam)
  const canvas = document.createElement('canvas')
  if (mode === 'worker') {
    await wallRenderer.draw(canvas, { P, w: r.w, h: r.h, hq: r.hq ?? true })
  } else if (mode === 'main') {
    await ensureMonoFont()
    canvas.width = r.w; canvas.height = r.h
    await drawWall(canvas.getContext('2d')!, P, r.w, r.h, { hq: r.hq ?? true })
  } else {
    await ensureMonoFont()
    const V1 = await import('../../tests/legacy/engine.v1')
    canvas.width = r.w; canvas.height = r.h
    await new Promise<void>(res => V1.drawCanvas(canvas, P as never, r.w, r.h, () => { }, () => res(), r.hq ?? true))
  }
  return canvas
}

const api = {
  /** Pixel hash of one render. */
  async hash(mode: Mode, r: Req) { return hashPixels(await render(mode, r)) },
  /** PNG data URL of one render (debugging). */
  async dataUrl(mode: Mode, r: Req) { const c = await render(mode, r); const t = document.createElement('canvas'); t.width = c.width; t.height = c.height; t.getContext('2d')!.drawImage(c, 0, 0); return t.toDataURL('image/png') },
  /** How different two renders are, pixel by pixel. */
  async diff(a: Mode, b: Mode, r: Req) {
    const [pa, pb] = [await pixels(await render(a, r)), await pixels(await render(b, r))]
    let differing = 0, maxDelta = 0
    for (let i = 0; i < pa.length; i += 4) {
      let d = 0
      for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(pa[i + c] - pb[i + c]))
      if (d) { differing++; maxDelta = Math.max(maxDelta, d) }
    }
    return { width: r.w, height: r.h, pixels: pa.length / 4, differing, maxDelta }
  },
  /** Time + longest main-thread tasks while rendering (worker, or main thread for comparison). */
  async measure(mode: Mode, r: Req) {
    const lt = longTasks()
    const t0 = performance.now()
    await render(mode, r)
    const ms = performance.now() - t0
    await new Promise(res => setTimeout(res, 100))
    const tasks = lt.stop()
    return { ms: Math.round(ms), longestTaskMs: Math.round(Math.max(0, ...tasks)), longTasks: tasks.length }
  },
  /** Measure a PNG export through the worker (what the Download button does). */
  async measureExport(r: Req) {
    const lt = longTasks(); const t0 = performance.now()
    const blob = await wallRenderer.exportPng({ P: parseUUID(r.uuid, r.fam), w: r.w, h: r.h, watermark: false })
    const ms = performance.now() - t0
    await new Promise(res => setTimeout(res, 100))
    const tasks = lt.stop()
    return { ms: Math.round(ms), bytes: blob.size, type: blob.type, longestTaskMs: Math.round(Math.max(0, ...tasks)), longTasks: tasks.length }
  },
  /** Fire several draws at one canvas back to back; only the last may land. */
  async cancelRace(fams: string[], uuid: string) {
    const canvas = document.createElement('canvas')
    const results = await Promise.allSettled(fams.map(f => wallRenderer.draw(canvas, { P: parseUUID(uuid, f), w: 640, h: 360, hq: true })))
    const aborted = results.filter(x => x.status === 'rejected' && isAbort(x.reason)).length
    const last = fams[fams.length - 1]
    const expected = await hashPixels(await render('main', { uuid, fam: last, w: 640, h: 360 }))
    return { aborted, fulfilled: results.filter(x => x.status === 'fulfilled').length, finalMatchesLast: (await hashPixels(canvas)) === expected }
  },
  /** Input responsiveness probe: how late do 10 ms timers fire while `work` runs? */
  async jank(mode: 'worker' | 'v1', r: Req) {
    let worst = 0, last = performance.now()
    const id = setInterval(() => { const n = performance.now(); worst = Math.max(worst, n - last - 10); last = n }, 10)
    await render(mode, r)
    clearInterval(id)
    return { worstTimerLagMs: Math.round(worst) }
  },
}

declare global { interface Window { __lab: typeof api } }

export default function Lab() {
  useEffect(() => { window.__lab = api }, [])
  return <main style={{ padding: 16, fontFamily: 'monospace' }}>lab</main>
}
