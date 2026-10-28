import type { UUIDParams } from './types'

export const HERO_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

export interface WallCard { uuid: string; fam: string; pal?: Partial<UUIDParams> }

/** "Same UUID, six faces" showcase. Hand-picked palettes laid over the parsed values (v1 data). */
export const SHOWCASE: WallCard[] = [
  { uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', fam: 'flowfield', pal: { hue: 215, sat: 72, lum1: 74, lum2: 16, accent: 42 } },
  { uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', fam: 'voronoi', pal: { hue: 342, sat: 65, lum1: 72, lum2: 14, accent: 195 } },
  { uuid: 'deadbeef-cafe-4abe-b00d-123456789abc', fam: 'geometric', pal: { hue: 145, sat: 58, lum1: 70, lum2: 15, accent: 275 } },
  { uuid: '1a2b3c4d-5e6f-4789-9abc-def012345678', fam: 'ascii', pal: { hue: 28, sat: 60, lum1: 68, lum2: 12, accent: 200 } },
  { uuid: '9f8e7d6c-5b4a-4392-8170-0f1e2d3c4b5a', fam: 'mandala', pal: { hue: 260, sat: 65, lum1: 72, lum2: 14, accent: 45 } },
  { uuid: 'c0ffee00-1337-4abc-def0-123456789abc', fam: 'wave', pal: { hue: 185, sat: 62, lum1: 70, lum2: 16, accent: 340 } },
]

/** Curated gallery (v1 data). */
export const GALLERY: WallCard[] = [
  { uuid: '550e8400-e29b-41d4-a716-446655440000', fam: 'voronoi', pal: { hue: 280, sat: 60, lum1: 68, lum2: 14, accent: 160 } },
  { uuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', fam: 'flowfield', pal: { hue: 195, sat: 70, lum1: 72, lum2: 18, accent: 30 } },
  { uuid: '7c9e6679-7425-40de-944b-e07fc1f90ae7', fam: 'geometric', pal: { hue: 355, sat: 65, lum1: 70, lum2: 15, accent: 200 } },
  { uuid: '9c858900-8a4d-11d1-8f14-001b62e03e77', fam: 'ascii', pal: { hue: 120, sat: 55, lum1: 65, lum2: 12, accent: 300 } },
  { uuid: '3d813cbb-47fb-32ba-91df-831e1593ac29', fam: 'flowfield', pal: { hue: 35, sat: 68, lum1: 75, lum2: 20, accent: 210 } },
  { uuid: 'b45a70b0-abad-4083-a8b5-cd7df9c4e342', fam: 'voronoi', pal: { hue: 260, sat: 62, lum1: 70, lum2: 16, accent: 80 } },
  { uuid: 'e9f77540-1be9-4432-8c29-c12b10ffb1f3', fam: 'geometric', pal: { hue: 170, sat: 58, lum1: 68, lum2: 13, accent: 320 } },
  { uuid: '4e56de08-d67e-4c5a-b0e8-3c1e2f4a5b6c', fam: 'ascii', pal: { hue: 45, sat: 64, lum1: 72, lum2: 18, accent: 230 } },
]
