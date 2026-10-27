import { FAMS } from './constants'
import { uuidSeed } from './prng'
import type { UUIDParams } from './types'

/**
 * UUID text -> drawing parameters. Verbatim logic from v1. Note the quirks that existing walls
 * depend on: input is cleaned to 32 hex (padded with 0) for the fields, but `seed` hashes the raw
 * string (lowercased, dashes removed, NOT trimmed, NOT stripped of non-hex).
 */
export function parseUUID(uuid: string, forceFamily?: string): UUIDParams {
  const clean = uuid.trim().replace(/-/g, '').toLowerCase().replace(/[^0-9a-f]/g, '').padEnd(32, '0').slice(0, 32)
  const s = (o: number, l: number) => parseInt(clean.slice(o, o + l), 16) || 0
  const fi = forceFamily ? (FAMS as readonly string[]).indexOf(forceFamily) : s(0, 4) % 6
  return {
    family: FAMS[Math.max(0, fi)], hue: s(4, 4) % 360, sat: 50 + s(8, 4) % 35,
    lum1: 55 + s(12, 4) % 28, lum2: 14 + s(16, 4) % 18,
    accent: (s(4, 4) % 360 + 100 + s(20, 4) % 100) % 360,
    density: 0.3 + s(24, 4) % 1000 / 1000 * 0.7,
    angle: s(28, 4) % 360 * Math.PI / 180, mood: s(0, 2) % 100 / 100, seed: uuidSeed(uuid),
  }
}

/** Gallery cards: hand-picked palette laid over the parsed values (v1 SmallCanvas behaviour). */
export function paramsWithPalette(uuid: string, family: string, pal?: Partial<UUIDParams>): UUIDParams {
  return pal
    ? { ...parseUUID(uuid), ...pal, family, seed: uuidSeed(uuid) }
    : parseUUID(uuid, family)
}

/** The faint Flow Field behind the closing call-to-action (v1 renderCTACanvas). */
export function ctaParams(): UUIDParams {
  return { ...parseUUID('deadbeef-cafe-4abe-b00d-123456789abc'), family: 'flowfield', hue: 38, sat: 55, lum1: 72, lum2: 18, accent: 200, seed: uuidSeed('deadbeef') }
}
