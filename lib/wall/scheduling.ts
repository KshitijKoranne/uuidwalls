export class CancelledError extends Error {
  constructor() { super('Render cancelled'); this.name = 'AbortError' }
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

// A zero-delay task hop. MessageChannel avoids the 4 ms clamp setTimeout gets after a few nested
// calls, and works both in a worker and on the main thread.
let hop: (() => Promise<void>) | null = null
function yieldTask(): Promise<void> {
  if (!hop) {
    if (typeof MessageChannel !== 'undefined') {
      const { port1, port2 } = new MessageChannel()
      const waiting: Array<() => void> = []
      port1.onmessage = () => { waiting.shift()?.() }
      hop = () => new Promise<void>(res => { waiting.push(res); port2.postMessage(null) })
    } else {
      hop = () => new Promise<void>(res => setTimeout(res, 0))
    }
  }
  return hop()
}

export interface CheckpointOptions {
  isCancelled: () => boolean
  onProgress?: (ratio: number) => void
  /** Longest stretch of work before handing control back. Keeps input responsive on the main thread. */
  sliceMs?: number
  /** Minimum gap between progress callbacks. */
  progressEveryMs?: number
}

/** Builds the `checkpoint` hook the engine calls between chunks: cancels, reports, and yields. */
export function makeCheckpoint({ isCancelled, onProgress, sliceMs = 12, progressEveryMs = 80 }: CheckpointOptions) {
  let sliceStart = now(), lastProgress = 0
  return async (ratio: number) => {
    if (isCancelled()) throw new CancelledError()
    const t = now()
    if (t - lastProgress >= progressEveryMs) { lastProgress = t; onProgress?.(ratio) }
    if (t - sliceStart >= sliceMs) {
      await yieldTask()
      if (isCancelled()) throw new CancelledError()
      sliceStart = now()
    }
  }
}
