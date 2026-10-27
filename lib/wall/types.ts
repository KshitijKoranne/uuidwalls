export type FamilyId = 'flowfield' | 'voronoi' | 'geometric' | 'ascii' | 'mandala' | 'wave'

export interface UUIDParams {
  family: string; hue: number; sat: number; lum1: number; lum2: number;
  accent: number; density: number; angle: number; mood: number; seed: number;
}

/** The 2D context surface the engine draws on: a page canvas, an OffscreenCanvas, or a test recorder. */
export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export interface DrawOptions {
  /** Pixel-perfect Voronoi (hero and downloads). false = coarse cells for thumbnails. */
  hq?: boolean
  /** Source of the flow field start jitter. Default: seeded from the wall, so renders are reproducible. */
  rand?: () => number
  /**
   * Called between chunks with progress 0..1. May return a promise to yield to the event loop.
   * Throw from it to cancel the render.
   */
  checkpoint?: (ratio: number) => void | Promise<void>
}
