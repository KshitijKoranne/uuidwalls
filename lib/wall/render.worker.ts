import type { FromWorker, ToWorker } from './protocol'
import { runRender } from './runner'
import { CancelledError } from './scheduling'

// Dedicated worker entry. Runs one render at a time (the client queues); a `cancel` message is
// noticed at the next chunk boundary because the engine yields to the event loop between chunks.
type Scope = {
  postMessage(m: FromWorker, transfer?: Transferable[]): void
  onmessage: ((e: MessageEvent<ToWorker>) => void) | null
}
const scope = self as unknown as Scope
const cancelled = new Set<number>()

function offscreenSupported() {
  try {
    return typeof OffscreenCanvas !== 'undefined' && !!new OffscreenCanvas(1, 1).getContext('2d')
  } catch { return false }
}

scope.onmessage = async (e: MessageEvent<ToWorker>) => {
  const m = e.data
  if (m.type === 'probe') { scope.postMessage({ type: 'probe', ok: offscreenSupported() }); return }
  if (m.type === 'cancel') { cancelled.add(m.id); return }
  const { id, spec } = m
  try {
    const surface = await runRender(spec, {
      createSurface: (w, h) => {
        const canvas = new OffscreenCanvas(w, h)
        return { canvas, ctx: canvas.getContext('2d', { willReadFrequently: false }) as OffscreenCanvasRenderingContext2D }
      },
      isCancelled: () => cancelled.has(id),
      onProgress: ratio => scope.postMessage({ type: 'progress', id, ratio }),
    })
    const canvas = surface.canvas as OffscreenCanvas
    if (spec.output === 'png') {
      const blob = await canvas.convertToBlob({ type: 'image/png' })
      const png = await blob.arrayBuffer()
      scope.postMessage({ type: 'png', id, png }, [png])
    } else {
      const bitmap = canvas.transferToImageBitmap()
      scope.postMessage({ type: 'bitmap', id, bitmap }, [bitmap])
    }
  } catch (err) {
    if (err instanceof CancelledError) scope.postMessage({ type: 'cancelled', id })
    else scope.postMessage({ type: 'error', id, message: err instanceof Error ? err.message : 'Render failed' })
  } finally {
    cancelled.delete(id)
  }
}
