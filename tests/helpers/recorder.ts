import { createHash } from 'node:crypto'

// A fake CanvasRenderingContext2D that hashes every call (name + exact arguments) and every
// property assignment, in order. Two engines that produce the same hash issued the same drawing
// program, which is platform independent (no rasteriser involved).
//
// ImageData is hashed by content. Consecutive putImageData calls are collapsed into one, hashed at
// the moment the next different call happens (or at digest time), so an engine that uploads the
// image once at the end equals one that uploaded it after every chunk.

type Pending = { img: { data: Uint8ClampedArray }; args: unknown[] }

export function makeRecorder() {
  const h = createHash('sha256')
  let calls = 0
  let pending: Pending | null = null

  const fmt = (x: unknown): string => {
    if (typeof x === 'number') return Object.is(x, -0) ? '-0' : String(x)
    if (typeof x === 'string') return JSON.stringify(x)
    if (x && typeof x === 'object' && 'data' in (x as object)) return 'IMG'
    return String(x)
  }
  const flush = () => {
    if (!pending) return
    const d = createHash('sha256').update(pending.img.data).digest('hex')
    h.update(`putImageData(${pending.args.map(fmt).join(',')},${d})\n`)
    calls++
    pending = null
  }

  const store: Record<string, unknown> = {}
  const ctx = new Proxy(store, {
    get(t, k: string) {
      if (k in t) return t[k]
      if (k === 'createImageData') {
        return (w: number, hh: number) => {
          flush()
          h.update(`createImageData(${w},${hh})\n`); calls++
          return { data: new Uint8ClampedArray(w * hh * 4), width: w, height: hh }
        }
      }
      if (k === 'putImageData') {
        return (img: Pending['img'], ...rest: unknown[]) => {
          if (pending && pending.img !== img) flush()
          pending = { img, args: rest }
        }
      }
      return (...a: unknown[]) => { flush(); h.update(`${k}(${a.map(fmt).join(',')})\n`); calls++ }
    },
    set(t, k: string, v) { flush(); h.update(`set ${k}=${fmt(v)}\n`); t[k] = v; return true },
  }) as unknown as CanvasRenderingContext2D

  return { ctx, digest: () => { flush(); return `${h.copy().digest('hex').slice(0, 24)}:${calls}` } }
}

export function fakeCanvas(ctx: CanvasRenderingContext2D) {
  return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement
}
