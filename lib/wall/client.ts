import { MAX_PIXELS } from './constants'
import type { FromWorker, RenderSpec, ToWorker } from './protocol'
import { runRender, type Surface } from './runner'
import { CancelledError } from './scheduling'
import type { UUIDParams } from './types'

// Client for the render engine: worker lanes with a priority queue, cancellation, progress, and a
// main-thread fallback (same engine, time-sliced) when workers or OffscreenCanvas 2D are missing.
//
//   lane 'hero'   the big on-page wall. Highest priority, latest request per canvas wins.
//   lane 'thumb'  gallery cards. Shares the hero worker on weak devices (<= 2 cores).
//   lane 'export' downloads. Own worker, released when idle so a 4K buffer does not linger.

export type LaneName = 'hero' | 'thumb' | 'export'
const PRIORITY: Record<LaneName, number> = { hero: 0, export: 1, thumb: 2 }

type Output = { kind: 'bitmap'; bitmap: ImageBitmap } | { kind: 'surface'; surface: Surface } | { kind: 'png'; png: ArrayBuffer | Blob }

interface Job {
  id: number
  lane: LaneName
  spec: RenderSpec
  onProgress?: (ratio: number) => void
  cancelled: boolean
  running: boolean
  resolve(o: Output): void
  reject(e: unknown): void
}

interface Executor {
  run(job: Job): Promise<Output>
  cancel(job: Job): void
  dispose(): void
}

let nextId = 1

// ── Worker executor ──────────────────────────────────────────────────────────
class WorkerUnsupported extends Error {}

class WorkerExecutor implements Executor {
  private worker: Worker
  private ready: Promise<void>
  private active: { job: Job; settle: (o: Output | Error) => void } | null = null

  constructor() {
    this.worker = new Worker(new URL('./render.worker.ts', import.meta.url), { type: 'module' })
    this.ready = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new WorkerUnsupported('worker probe timed out')), 5000)
      const onProbe = (e: MessageEvent<FromWorker>) => {
        if (e.data.type !== 'probe') return
        clearTimeout(timer)
        this.worker.removeEventListener('message', onProbe)
        if (e.data.ok) resolve(); else reject(new WorkerUnsupported('OffscreenCanvas 2D unavailable in worker'))
      }
      this.worker.addEventListener('message', onProbe)
      this.worker.addEventListener('error', () => { clearTimeout(timer); reject(new WorkerUnsupported('worker failed to start')) }, { once: true })
      this.post({ type: 'probe' })
    })
    this.worker.addEventListener('message', e => this.onMessage(e.data as FromWorker))
    this.worker.addEventListener('error', () => this.active?.settle(new Error('Render worker crashed')))
  }

  private post(m: ToWorker) { this.worker.postMessage(m) }

  private onMessage(m: FromWorker) {
    const a = this.active
    if (!a || m.type === 'probe' || m.id !== a.job.id) {
      if (m.type === 'bitmap') m.bitmap.close()
      return
    }
    if (m.type === 'progress') a.job.onProgress?.(m.ratio)
    else if (m.type === 'bitmap') a.settle({ kind: 'bitmap', bitmap: m.bitmap })
    else if (m.type === 'png') a.settle({ kind: 'png', png: m.png })
    else if (m.type === 'cancelled') a.settle(new CancelledError())
    else if (m.type === 'error') a.settle(new Error(m.message))
  }

  async run(job: Job): Promise<Output> {
    await this.ready
    if (job.cancelled) throw new CancelledError()
    return new Promise<Output>((resolve, reject) => {
      this.active = { job, settle: o => { this.active = null; if (o instanceof Error) reject(o); else resolve(o) } }
      this.post({ type: 'render', id: job.id, spec: job.spec })
    })
  }

  cancel(job: Job) { if (this.active?.job === job) this.post({ type: 'cancel', id: job.id }) }
  dispose() { this.worker.terminate() }
}

// ── Main-thread executor (fallback) ──────────────────────────────────────────
class MainExecutor implements Executor {
  async run(job: Job): Promise<Output> {
    const surface = await runRender(job.spec, {
      createSurface: (w, h) => {
        const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
        return { canvas, ctx: canvas.getContext('2d')! }
      },
      isCancelled: () => job.cancelled,
      onProgress: job.onProgress,
    })
    if (job.spec.output === 'png') {
      const canvas = surface.canvas as HTMLCanvasElement
      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'))
      if (!blob) throw new Error('Could not generate image')
      return { kind: 'png', png: blob }
    }
    return { kind: 'surface', surface }
  }
  cancel() { /* noticed through job.cancelled at the next chunk */ }
  dispose() { /* nothing held */ }
}

// ── Lane ─────────────────────────────────────────────────────────────────────
let workersBroken = false

class Lane {
  private exec: Executor | null = null
  private queue: Job[] = []
  private busy = false
  constructor(private releaseWhenIdle: boolean) {}

  private executor(): Executor {
    if (!this.exec) this.exec = !workersBroken && typeof Worker !== 'undefined' ? new WorkerExecutor() : new MainExecutor()
    return this.exec
  }

  submit(job: Job) {
    const i = this.queue.findIndex(q => PRIORITY[q.lane] > PRIORITY[job.lane])
    if (i === -1) this.queue.push(job)
    else this.queue.splice(i, 0, job)
    void this.pump()
  }

  cancel(job: Job) {
    if (job.cancelled) return
    job.cancelled = true
    job.reject(new CancelledError())
    const i = this.queue.indexOf(job)
    if (i !== -1) this.queue.splice(i, 1)
    else if (job.running) this.exec?.cancel(job)
  }

  private async pump() {
    if (this.busy) return
    const job = this.queue.shift()
    if (!job) {
      if (this.releaseWhenIdle && this.exec) { this.exec.dispose(); this.exec = null }
      return
    }
    this.busy = true; job.running = true
    try {
      let out: Output
      try {
        out = await this.executor().run(job)
      } catch (e) {
        if (e instanceof WorkerUnsupported) {
          // No usable worker here: remember it and run this job (and all later ones) on the main thread.
          workersBroken = true; this.exec?.dispose(); this.exec = new MainExecutor()
          out = await this.exec.run(job)
        } else throw e
      }
      if (job.cancelled) { if (out.kind === 'bitmap') out.bitmap.close() } else job.resolve(out)
    } catch (e) {
      if (!job.cancelled) job.reject(e)
    } finally {
      this.busy = false; job.running = false
      void this.pump()
    }
  }
}

// ── Public API ───────────────────────────────────────────────────────────────
const lanes: Partial<Record<LaneName, Lane>> = {}
function laneFor(name: LaneName): Lane {
  const weak = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 2) <= 2
  const key: LaneName = name === 'thumb' && weak ? 'hero' : name
  return (lanes[key] ??= new Lane(key === 'export'))
}

export interface WallSize { P: UUIDParams; w: number; h: number; hq?: boolean }
export interface CallOptions { signal?: AbortSignal; onProgress?: (ratio: number) => void }

const latestPerCanvas = new WeakMap<HTMLCanvasElement, { job: Job; lane: Lane }>()

function enqueue(lane: LaneName, spec: RenderSpec, opts: CallOptions): { job: Job; promise: Promise<Output> } {
  if (spec.w * spec.h > MAX_PIXELS) return { job: null as never, promise: Promise.reject(new Error('Image is too large for this device')) }
  let job!: Job
  const promise = new Promise<Output>((resolve, reject) => {
    job = { id: nextId++, lane, spec, onProgress: opts.onProgress, cancelled: false, running: false, resolve, reject }
  })
  const l = laneFor(lane)
  opts.signal?.addEventListener('abort', () => l.cancel(job), { once: true })
  if (opts.signal?.aborted) { job.cancelled = true; job.reject(new CancelledError()); return { job, promise } }
  l.submit(job)
  return { job, promise }
}

export const isAbort = (e: unknown) => e instanceof Error && e.name === 'AbortError'

export const wallRenderer = {
  /**
   * Render into a visible canvas. A newer call for the same canvas cancels the older one, so a quick
   * run of family switches never leaves a stale wall on screen.
   */
  async draw(canvas: HTMLCanvasElement, req: WallSize, opts: CallOptions & { lane?: 'hero' | 'thumb' } = {}): Promise<void> {
    const lane = opts.lane ?? 'hero'
    const prev = latestPerCanvas.get(canvas)
    if (prev) prev.lane.cancel(prev.job)
    const { job, promise } = enqueue(lane, { P: req.P, w: req.w, h: req.h, hq: req.hq ?? lane === 'hero', watermark: false, output: 'bitmap' }, opts)
    if (job) latestPerCanvas.set(canvas, { job, lane: laneFor(lane) })
    const out = await promise
    if (out.kind === 'bitmap') {
      const bmp = canvas.getContext('bitmaprenderer')
      if (!bmp) throw new Error('Canvas is bound to another context')
      // transferFromImageBitmap does not resize the canvas; the bitmap would be scaled into the old size.
      if (canvas.width !== out.bitmap.width || canvas.height !== out.bitmap.height) { canvas.width = out.bitmap.width; canvas.height = out.bitmap.height }
      bmp.transferFromImageBitmap(out.bitmap)
    } else if (out.kind === 'surface') {
      canvas.width = req.w; canvas.height = req.h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas is bound to another context')
      ctx.drawImage(out.surface.canvas as CanvasImageSource, 0, 0)
    }
  },

  /** Render a PNG file (downloads). Never touches the page canvases. */
  async exportPng(req: WallSize & { watermark?: boolean }, opts: CallOptions = {}): Promise<Blob> {
    const out = await enqueue('export', { P: req.P, w: req.w, h: req.h, hq: true, watermark: !!req.watermark, output: 'png' }, opts).promise
    if (out.kind !== 'png') throw new Error('Unexpected render output')
    return out.png instanceof Blob ? out.png : new Blob([out.png], { type: 'image/png' })
  },
}
