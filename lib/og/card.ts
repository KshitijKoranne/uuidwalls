import path from 'node:path'
import { createCanvas, GlobalFonts } from '@napi-rs/canvas'
import { FAM_LABEL } from '@/lib/wall/constants'
import { drawWall } from '@/lib/wall/render'
import type { Ctx2D, UUIDParams } from '@/lib/wall/types'

// Server-side share card: the wall drawn by the same engine as the browser (on a Skia canvas), plus a
// plain caption. Anti-aliasing can differ slightly from the browser; the composition is the same.
// Only the wall token's parameters come in here, never a UUID.

export const CARD_WIDTH = 1200
export const CARD_HEIGHT = 630

let fontsReady = false
function ensureFonts() {
  if (fontsReady) return
  GlobalFonts.registerFromPath(path.join(process.cwd(), 'public', 'fonts', 'ibm-plex-mono-latin-400.woff2'), 'IBM Plex Mono')
  fontsReady = true
}

export async function renderCardJpeg(P: UUIDParams): Promise<Buffer> {
  ensureFonts()
  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT)
  const ctx = canvas.getContext('2d')
  await drawWall(ctx as unknown as Ctx2D, P, CARD_WIDTH, CARD_HEIGHT, { hq: true })

  const scrim = ctx.createLinearGradient(0, CARD_HEIGHT - 190, 0, CARD_HEIGHT)
  scrim.addColorStop(0, 'rgba(10,9,8,0)'); scrim.addColorStop(1, 'rgba(10,9,8,0.88)')
  ctx.fillStyle = scrim; ctx.fillRect(0, CARD_HEIGHT - 190, CARD_WIDTH, 190)

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#f0ede8'; ctx.font = '40px "IBM Plex Mono", monospace'; ctx.textAlign = 'left'
  ctx.fillText('UUIDWalls', 56, CARD_HEIGHT - 84)
  ctx.fillStyle = 'rgba(240,237,232,0.75)'; ctx.font = '24px "IBM Plex Mono", monospace'
  ctx.fillText(`${FAM_LABEL[P.family] ?? P.family} · made from a device UUID`, 56, CARD_HEIGHT - 44)
  ctx.textAlign = 'right'; ctx.fillText('uuidwalls.vercel.app', CARD_WIDTH - 56, CARD_HEIGHT - 44)

  return canvas.toBuffer('image/jpeg', 82)
}
