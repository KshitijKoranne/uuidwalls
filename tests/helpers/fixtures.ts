// Fixed inputs for the determinism tests. Never edit existing entries: goldens depend on them.
export const HERO = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

// Used for rendering goldens (12).
export const RENDER_UUIDS = [
  HERO,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'deadbeef-cafe-4abe-b00d-123456789abc',
  '1a2b3c4d-5e6f-4789-9abc-def012345678',
  '9f8e7d6c-5b4a-4392-8170-0f1e2d3c4b5a',
  'c0ffee00-1337-4abc-def0-123456789abc',
  '550e8400-e29b-41d4-a716-446655440000',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  '00000000-0000-0000-0000-000000000000',
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'F47AC10B-58CC-4372-A567-0E02B2C3D479',
  'F47AC10B58CC4372A5670E02B2C3D479',
]

// Used for parameter parsing goldens: includes malformed input that real users type.
export const PARAM_INPUTS = [
  ...RENDER_UUIDS,
  '3d813cbb-47fb-32ba-91df-831e1593ac29',
  'b45a70b0-abad-4083-a8b5-cd7df9c4e342',
  'e9f77540-1be9-4432-8c29-c12b10ffb1f3',
  '4e56de08-d67e-4c5a-b0e8-3c1e2f4a5b6c',
  '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  '9c858900-8a4d-11d1-8f14-001b62e03e77',
  'abcdef12',
  'abcdef1',
  '  f47ac10b-58cc-4372-a567-0e02b2c3d479  ',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479-extra-tail',
  'zzzz-hello-world',
  'not a uuid at all',
  '',
  '0',
  'ä-ö-ü-ß-0123456789abcdef',
  '{F47AC10B-58CC-4372-A567-0E02B2C3D479}',
  'urn:uuid:f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '1'.repeat(64),
]

export const FAMILIES = ['flowfield', 'voronoi', 'geometric', 'ascii', 'mandala', 'wave'] as const

// Deterministic stand-in for Math.random so the one non-deterministic v1 line (flow field jitter)
// can be compared byte for byte between v1 and v2.
export function lcg(seed = 12345) {
  let s = seed >>> 0
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 }
}

// Which (family, uuid-index, size, hq) combinations get a render golden. Kept small enough for CI:
// the recorder hashes every call, and 4K flow field alone is millions of calls.
export interface RenderCase { fam: string; u: number[]; w: number; h: number; hq: boolean }
export const RENDER_CASES: RenderCase[] = [
  // small size: every family x all 12 UUIDs
  ...FAMILIES.map(fam => ({ fam, u: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], w: 480, h: 270, hq: true })),
  // voronoi thumbnail mode (coarse pixels)
  { fam: 'voronoi', u: [0, 1, 6], w: 480, h: 270, hq: false },
  { fam: 'voronoi', u: [0, 6], w: 240, h: 160, hq: false },
  // phone size for the single-pass families and the heavy ones
  ...(['geometric', 'ascii', 'mandala', 'wave', 'voronoi'] as const).map(fam => ({ fam, u: [0, 2, 8], w: 1290, h: 2796, hq: true })),
  // larger flow field, one UUID
  { fam: 'flowfield', u: [0], w: 1280, h: 720, hq: true },
  // 4K for everything that is affordable
  ...(['geometric', 'ascii', 'mandala', 'wave', 'voronoi'] as const).map(fam => ({ fam, u: [0], w: 3840, h: 2160, hq: true })),
]
