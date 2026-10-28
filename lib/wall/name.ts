import type { UUIDParams } from './types'

// Deterministic wall names (SPEC section 13): hue rounded to the nearest 30 degrees gives the colour
// word, the family gives the noun. "Cobalt Tide" = hue 210, Wave. A pure function of the parsed
// parameters, separate from rendering, so it can never change a wall. Pinned by the golden tests.
// Only 12 x 6 = 72 names exist: a name is a handle for a look, not an identifier.

const HUE_WORDS = ['Ember', 'Amber', 'Citrine', 'Lime', 'Moss', 'Jade', 'Lagoon', 'Cobalt', 'Indigo', 'Violet', 'Orchid', 'Rose'] as const

const FAMILY_NOUNS: Record<string, string> = {
  flowfield: 'Flow', voronoi: 'Mosaic', geometric: 'Facets', ascii: 'Glyphs', mandala: 'Bloom', wave: 'Tide',
}

export function hueWord(hue: number): string {
  const h = Number.isFinite(hue) ? hue : 0
  const bucket = ((Math.round(h / 30) % 12) + 12) % 12 // 345..359 round to 12, which is Ember again
  return HUE_WORDS[bucket]
}

export function wallName(P: Pick<UUIDParams, 'hue' | 'family'>): string {
  return `${hueWord(P.hue)} ${FAMILY_NOUNS[P.family] ?? 'Wall'}`
}
