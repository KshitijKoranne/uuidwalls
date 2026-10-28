import { createCardService } from '@/lib/og/service'
import { renderCardJpeg } from '@/lib/og/card'
import { decodeWall } from '@/lib/wall/token'

export const runtime = 'nodejs'
export const maxDuration = 30

// Per-wall share image: /w/<token>/og.jpg. Immutable (the token fixes the wall), so the CDN keeps it.
// Each distinct token costs one render (Flow Field about 3 s on a laptop). The render yields to the
// event loop between chunks, at most 2 run at once per instance, and extra callers get 503 + Retry-After
// (platform crawlers retry). Owner action recommended: a Vercel firewall rate limit on /w/*/og.jpg.
const service = createCardService(async token => {
  const P = decodeWall(token)
  if (!P) throw new Error('invalid token')
  return renderCardJpeg(P)
})

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!decodeWall(token)) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'public, max-age=300' } })
  const r = await service(token)
  if (r.status === 'busy') return new Response('Busy, retry shortly', { status: 503, headers: { 'Retry-After': '5', 'Cache-Control': 'no-store' } })
  return new Response(new Uint8Array(r.jpg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' },
  })
}
