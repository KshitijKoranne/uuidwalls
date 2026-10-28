import { describe, expect, it } from 'vitest'
import { checkSeed } from '@/lib/wall/seed'
import { parseUUID } from '@/lib/wall/params'

const U = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

describe('seed field validation', () => {
  it('a clean UUID is valid as typed', () => expect(checkSeed(U)).toEqual({ status: 'valid', value: U }))
  it('cleans up case, braces, spaces, no dashes and the urn prefix, and says so', () => {
    for (const raw of [U.toUpperCase(), `{${U}}`, ` ${U} `, U.replace(/-/g, ''), `urn:uuid:${U}`, '{F47AC10B-58CC-4372-A567-0E02B2C3D479}']) expect(checkSeed(raw), raw).toEqual({ status: 'normalized', value: U })
  })
  it('cleaning never changes the wall: the cleaned text gives the same parameters (and seed) as the plain UUID', () => {
    for (const raw of [U.toUpperCase(), U.replace(/-/g, '')]) {
      const c = checkSeed(raw)
      expect(c.status).toBe('normalized')
      if (c.status === 'normalized') expect(parseUUID(c.value, 'wave')).toEqual(parseUUID(U, 'wave'))
    }
  })
  it('accepts a 16-character Android ID', () => expect(checkSeed('9774d56d682e549c')).toEqual({ status: 'valid', value: '9774d56d682e549c' }))
  it('explains short and long input instead of padding it', () => {
    expect(checkSeed('f47ac10b')).toEqual({ status: 'short', found: 8 })
    expect(checkSeed(U + 'aa')).toEqual({ status: 'long', found: 34 })
  })
  it('lists the first three bad characters', () => expect(checkSeed('f47ac10b-58cc-4372-a567-0e02b2c3dzzg')).toEqual({ status: 'badchars', bad: ['z', 'g'] }))
  it('lists at most three, unique', () => expect(checkSeed('ghijklmn')).toEqual({ status: 'badchars', bad: ['g', 'h', 'i'] }))
  it('empty and whitespace-only are empty', () => { expect(checkSeed('')).toEqual({ status: 'empty' }); expect(checkSeed('   ')).toEqual({ status: 'empty' }) })
})
