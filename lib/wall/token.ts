import { ALGO_VERSION, FAMS } from './constants'
import type { FamilyId, UUIDParams } from './types'

// A wall token is the wall's derived look parameters, packed into 18 URL-safe characters, so a wall
// can be shared (and a social preview image rendered on the server) WITHOUT the device UUID.
//
// What it contains: family, hue, saturation, two lightness values, accent hue, density, angle, mood
// and the 32-bit seed (an FNV-1a hash of the UUID). The UUID is not recoverable from it (122 random
// bits against a 32-bit hash and lossy fields), but it is not "nothing": the token fully describes
// the wall, which is the point.
//
// Layout (107 bits, shifted to 108 = 18 x 6 bits), most significant first:
//   version 4 | family 3 | hue 9 | sat-50 6 | lum1-55 5 | lum2-14 5 | accent 9 | density 10 | angle 9 | mood 7 | seed 32 | checksum 8
// Density, angle and mood are stored as the integers parseUUID derives them from, and rebuilt with the
// same expressions, so a decoded wall is bit-identical to parseUUID's (tested on thousands of UUIDs).

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const LENGTH = 18
const WIDTHS = [4, 3, 9, 6, 5, 5, 9, 10, 9, 7, 32] as const // bit widths, payload only
const PAYLOAD_BITS = WIDTHS.reduce((a, b) => a + b, 0) // 99

interface Fields { fam: number; hue: number; sat: number; lum1: number; lum2: number; accent: number; k: number; deg: number; mood: number; seed: number }

const LIMITS: Record<keyof Fields, number> = { fam: FAMS.length, hue: 360, sat: 35, lum1: 28, lum2: 18, accent: 360, k: 1000, deg: 360, mood: 100, seed: 2 ** 32 }

// Bits are handled as arrays of 0/1 (no BigInt: the build targets ES2017).
function pushBits(bits: number[], value: number, width: number) {
  for (let i = width - 1; i >= 0; i--) bits.push(Math.floor(value / 2 ** i) % 2)
}
function readBits(bits: number[], at: number, width: number) {
  let v = 0
  for (let i = 0; i < width; i++) v = v * 2 + bits[at + i]
  return v
}
/** 8-bit checksum over the payload bits taken as bytes (zero padded at the end). */
function checksum(payload: number[]): number {
  let h = 0xa5
  for (let at = 0; at < payload.length; at += 8) {
    let byte = 0
    for (let i = 0; i < 8; i++) byte = byte * 2 + (payload[at + i] ?? 0)
    h = (h * 31 + byte) & 0xff
  }
  return h
}

/** Must stay the same expressions as parseUUID (lib/wall/params.ts) so results are bit-identical. */
function paramsFrom(f: Fields): UUIDParams {
  return {
    family: FAMS[f.fam], hue: f.hue, sat: 50 + f.sat, lum1: 55 + f.lum1, lum2: 14 + f.lum2, accent: f.accent,
    density: 0.3 + f.k / 1000 * 0.7, angle: f.deg * Math.PI / 180, mood: f.mood / 100, seed: f.seed,
  }
}

const same = (a: UUIDParams, b: UUIDParams) => (Object.keys(a) as (keyof UUIDParams)[]).every(k => Object.is(a[k], b[k]))

function fieldsOf(P: UUIDParams): Fields {
  return {
    fam: (FAMS as readonly string[]).indexOf(P.family), hue: P.hue, sat: P.sat - 50, lum1: P.lum1 - 55, lum2: P.lum2 - 14, accent: P.accent,
    k: Math.round((P.density - 0.3) / 0.7 * 1000), deg: Math.round(P.angle * 180 / Math.PI), mood: Math.round(P.mood * 100), seed: P.seed,
  }
}

const inRange = (f: Fields) => (Object.keys(LIMITS) as (keyof Fields)[]).every(k => Number.isInteger(f[k]) && f[k] >= 0 && f[k] < LIMITS[k])

/** Encode a wall. Throws for parameters outside what parseUUID and the curated palettes can produce. */
export function encodeWall(P: UUIDParams): string {
  const f = fieldsOf(P)
  if (!inRange(f) || !same(paramsFrom(f), P)) throw new Error('This wall cannot be shared as a token')
  const values = [ALGO_VERSION, f.fam, f.hue, f.sat, f.lum1, f.lum2, f.accent, f.k, f.deg, f.mood, f.seed]
  const bits: number[] = []
  WIDTHS.forEach((w, i) => pushBits(bits, values[i], w))
  pushBits(bits, checksum(bits), 8)
  bits.push(0) // 107 -> 108 bits = 18 characters
  let out = ''
  for (let i = 0; i < LENGTH; i++) out += ALPHABET[readBits(bits, i * 6, 6)]
  return out
}

/** Decode a token. Returns null for anything malformed, tampered with, or from another algorithm version. */
export function decodeWall(token: string | null | undefined): UUIDParams | null {
  if (typeof token !== 'string' || token.length !== LENGTH) return null
  const bits: number[] = []
  for (const ch of token) {
    const v = ALPHABET.indexOf(ch)
    if (v < 0) return null
    pushBits(bits, v, 6)
  }
  if (bits[107] !== 0) return null // padding bit
  const payload = bits.slice(0, PAYLOAD_BITS)
  if (checksum(payload) !== readBits(bits, PAYLOAD_BITS, 8)) return null
  const vals: number[] = []
  let at = 0
  for (const w of WIDTHS) { vals.push(readBits(payload, at, w)); at += w }
  if (vals[0] !== ALGO_VERSION) return null
  const f: Fields = { fam: vals[1], hue: vals[2], sat: vals[3], lum1: vals[4], lum2: vals[5], accent: vals[6], k: vals[7], deg: vals[8], mood: vals[9], seed: vals[10] }
  return inRange(f) ? paramsFrom(f) : null
}

export type { FamilyId }
