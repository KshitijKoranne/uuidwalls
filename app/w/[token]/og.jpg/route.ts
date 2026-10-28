import { renderCardJpeg } from '@/lib/og/card'
import { decodeWall } from '@/lib/wall/token'

export const runtime = 'nodejs'
export const maxDuration = 30

// Per-wall share image: /w/<token>/og.jpg. Immutable (the token fixes the wall), so the CDN keeps it.
// Each distinct token costs one render (Flow Field about 3 s on a laptop), so concurrent renders per
// instance are capped; callers over the cap get 503 + Retry-After and the platform retries later.
const MAX_CONCURRENT = 2
let active = 0

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const P = decodeWall(token)
  if (!P) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'public, max-age=300' } })
  if (active >= MAX_CONCURRENT) return new Response('Busy, retry shortly', { status: 503, headers: { 'Retry-After': '5' } })
  active++
  try {
    const jpg = await renderCardJpeg(P)
    return new Response(new Uint8Array(jpg), {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' },
    })
  } finally {
    active--
  }
}
