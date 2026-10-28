// Share-card service: a small LRU cache, de-duplication of identical in-flight requests, and a hard
// cap on concurrent renders. Tokens are forgeable (the checksum is an error check, not a signature),
// so anyone can ask for unlimited distinct cards; the cap keeps that from starving the instance.
// Pure and injectable: the route wires the real renderer, tests wire a fake one.

export type CardResult = { status: 'ok'; jpg: Buffer } | { status: 'busy' }

export function createCardService(render: (token: string) => Promise<Buffer>, { maxConcurrent = 2, cacheSize = 32 } = {}) {
  const cache = new Map<string, Buffer>()
  const inflight = new Map<string, Promise<Buffer>>()
  let active = 0

  return async function card(token: string): Promise<CardResult> {
    const hit = cache.get(token)
    if (hit) { cache.delete(token); cache.set(token, hit); return { status: 'ok', jpg: hit } }

    const running = inflight.get(token)
    if (running) return { status: 'ok', jpg: await running } // same card requested again while rendering: share the work

    if (active >= maxConcurrent) return { status: 'busy' }
    active++
    const p = render(token)
      .then(jpg => {
        cache.set(token, jpg)
        while (cache.size > cacheSize) cache.delete(cache.keys().next().value as string)
        return jpg
      })
      .finally(() => { active--; inflight.delete(token) })
    inflight.set(token, p)
    return { status: 'ok', jpg: await p }
  }
}
