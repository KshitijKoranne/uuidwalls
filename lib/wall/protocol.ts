import type { UUIDParams } from './types'

/** Everything needed to render one image. Plain data: safe to postMessage. */
export interface RenderSpec {
  P: UUIDParams
  w: number
  h: number
  /** Pixel-perfect Voronoi. true for the hero and downloads, false for thumbnails. */
  hq: boolean
  watermark: boolean
  /** bitmap = transferable ImageBitmap for on-page canvases. png = encoded file for downloads. */
  output: 'bitmap' | 'png'
}

export type ToWorker =
  | { type: 'probe' }
  | { type: 'render'; id: number; spec: RenderSpec }
  | { type: 'cancel'; id: number }

export type FromWorker =
  | { type: 'probe'; ok: boolean }
  | { type: 'progress'; id: number; ratio: number }
  | { type: 'bitmap'; id: number; bitmap: ImageBitmap }
  | { type: 'png'; id: number; png: ArrayBuffer }
  | { type: 'cancelled'; id: number }
  | { type: 'error'; id: number; message: string }
