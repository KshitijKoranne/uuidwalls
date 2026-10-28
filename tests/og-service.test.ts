import { describe, expect, it } from 'vitest'
import { createCardService } from '@/lib/og/service'

const deferred = () => { let resolve!: (b: Buffer) => void; const promise = new Promise<Buffer>(r => { resolve = r }); return { promise, resolve } }

describe('share card service', () => {
  it('lets 2 renders run at once and answers the third with busy (the cap is real)', async () => {
    const jobs: Record<string, ReturnType<typeof deferred>> = { a: deferred(), b: deferred(), c: deferred() }
    const svc = createCardService(t => jobs[t].promise, { maxConcurrent: 2 })
    const a = svc('a'), b = svc('b')
    expect(await svc('c')).toEqual({ status: 'busy' })
    jobs.a.resolve(Buffer.from('A')); jobs.b.resolve(Buffer.from('B'))
    expect(await a).toEqual({ status: 'ok', jpg: Buffer.from('A') })
    expect((await b).status).toBe('ok')
    jobs.c.resolve(Buffer.from('C'))
    expect(await svc('c')).toEqual({ status: 'ok', jpg: Buffer.from('C') }) // a slot is free again
  })

  it('the same card requested while it renders shares one render and does not use a second slot', async () => {
    let renders = 0; const d = deferred()
    const svc = createCardService(() => { renders++; return d.promise }, { maxConcurrent: 1 })
    const first = svc('x'), second = svc('x'), third = svc('x')
    d.resolve(Buffer.from('X'))
    expect((await Promise.all([first, second, third])).map(r => r.status)).toEqual(['ok', 'ok', 'ok'])
    expect(renders).toBe(1)
  })

  it('caches finished cards (LRU) so a repeat does not render again, and evicts the oldest', async () => {
    let renders = 0
    const svc = createCardService(async t => { renders++; return Buffer.from(t) }, { cacheSize: 2 })
    await svc('a'); await svc('b'); await svc('a')
    expect(renders).toBe(2)
    await svc('c') // evicts b (a was touched more recently)
    await svc('a'); expect(renders).toBe(3)
    await svc('b'); expect(renders).toBe(4)
  })

  it('a failed render frees its slot and is not cached', async () => {
    let fail = true
    const svc = createCardService(async () => { if (fail) throw new Error('boom'); return Buffer.from('ok') }, { maxConcurrent: 1 })
    await expect(svc('a')).rejects.toThrow('boom')
    fail = false
    expect(await svc('a')).toEqual({ status: 'ok', jpg: Buffer.from('ok') })
  })
})
