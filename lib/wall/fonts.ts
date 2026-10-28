import { ASCII_FONT_FAMILY } from './families/ascii'

export const MONO_FONT_URL = '/fonts/ibm-plex-mono-latin-400.woff2'

type FontSet = { add(f: FontFace): void; has?(f: FontFace): boolean }
let loading: Promise<void> | null = null

/**
 * The ASCII wall and the watermark use IBM Plex Mono. Web fonts that the page loaded are not
 * visible to a worker, so the font file is fetched and registered in whichever scope renders
 * (worker or main thread). Failure is non-fatal: the canvas falls back to `monospace`.
 */
export function ensureMonoFont(): Promise<void> {
  if (loading) return loading
  loading = (async () => {
    try {
      const g = globalThis as unknown as { document?: { fonts: FontSet }; fonts?: FontSet }
      const set = g.document?.fonts ?? g.fonts
      if (!set || typeof FontFace === 'undefined') return
      const buf = await (await fetch(MONO_FONT_URL)).arrayBuffer()
      const face = new FontFace(ASCII_FONT_FAMILY, buf, { weight: '400', style: 'normal' })
      await face.load()
      set.add(face)
    } catch { /* keep the monospace fallback */ }
  })()
  return loading
}
