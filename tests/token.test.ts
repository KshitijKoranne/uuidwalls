import { describe, expect, it } from 'vitest'
import { decodeWall, encodeWall } from '@/lib/wall/token'
import { parseUUID } from '@/lib/wall/params'
import { FAMS } from '@/lib/wall/constants'
import { PARAM_INPUTS, lcg } from './helpers/fixtures'

const hex = (r: () => number, n: number) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(r() * 16)]).join('')
const randomUuid = (r: () => number) => `${hex(r, 8)}-${hex(r, 4)}-4${hex(r, 3)}-${'89ab'[Math.floor(r() * 4)]}${hex(r, 3)}-${hex(r, 12)}`

describe('wall token', () => {
  it('round-trips to exactly what parseUUID produces (3000 random UUIDs x random families, bit-identical)', () => {
    const r = lcg(2026)
    for (let i = 0; i < 3000; i++) {
      const u = randomUuid(r), fam = FAMS[Math.floor(r() * FAMS.length)]
      const P = parseUUID(u, fam)
      const t = encodeWall(P)
      expect(t).toMatch(/^[A-Za-z0-9_-]{18}$/)
      const back = decodeWall(t)
      expect(back).not.toBeNull()
      for (const k of Object.keys(P) as (keyof typeof P)[]) expect(Object.is(back![k], P[k]), `${u} ${fam} ${k}`).toBe(true)
    }
  })

  it('round-trips the awkward fixed inputs too (all-zero, all-f, malformed text)', () => {
    for (const u of PARAM_INPUTS) for (const fam of FAMS) expect(decodeWall(encodeWall(parseUUID(u, fam)))).toEqual(parseUUID(u, fam))
  })

  it('is deterministic and distinguishes walls', () => {
    const P = parseUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'voronoi')
    expect(encodeWall(P)).toBe(encodeWall(parseUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'voronoi')))
    expect(encodeWall(P)).not.toBe(encodeWall(parseUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'wave')))
    expect(encodeWall(P)).not.toBe(encodeWall(parseUUID('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'voronoi')))
  })

  it('a token does not contain the UUID', () => {
    const u = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    const t = encodeWall(parseUUID(u)).toLowerCase()
    for (let i = 0; i + 6 <= 32; i++) expect(t).not.toContain(u.replace(/-/g, '').slice(i, i + 6))
  })

  it('rejects garbage: wrong length, bad characters, empty, null', () => {
    for (const t of ['', 'abc', 'A'.repeat(17), 'A'.repeat(19), '!'.repeat(18), 'AAAAAAAAAAAAAAAAAA', null, undefined, 'a b c d e f g h i j']) expect(decodeWall(t as string)).toBeNull()
  })

  it('rejects tampering: almost every single-character change is caught, and anything accepted is still render-safe', () => {
    const r = lcg(7)
    let tried = 0, accepted = 0
    for (let n = 0; n < 40; n++) {
      const t = encodeWall(parseUUID(randomUuid(r), FAMS[n % 6]))
      for (let i = 0; i < t.length; i++) for (const ch of 'AZaz09-_') {
        if (ch === t[i]) continue
        tried++
        const P = decodeWall(t.slice(0, i) + ch + t.slice(i + 1))
        if (P) { accepted++; expect(FAMS).toContain(P.family); expect(P.hue).toBeLessThan(360); expect(P.density).toBeGreaterThanOrEqual(0.3); expect(P.density).toBeLessThanOrEqual(1) }
      }
    }
    expect(accepted / tried).toBeLessThan(0.02)
  })

  it('refuses parameters it cannot represent, instead of sharing a different wall', () => {
    const P = parseUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')
    expect(() => encodeWall({ ...P, hue: 400 })).toThrow(/cannot be shared/)
    expect(() => encodeWall({ ...P, density: 0.31234 })).toThrow(/cannot be shared/)
    expect(() => encodeWall({ ...P, family: 'plasma' })).toThrow(/cannot be shared/)
    expect(() => encodeWall({ ...P, seed: -1 })).toThrow(/cannot be shared/)
  })
})
