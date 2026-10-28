import type { FamilyId } from './types'

/** Order matters: parseUUID maps `hex % 6` to this list. Never reorder. */
export const FAMS: readonly FamilyId[] = ['flowfield', 'voronoi', 'geometric', 'ascii', 'mandala', 'wave']

export const FAM_LABEL: Record<string, string> = {
  flowfield: 'Flow Field', voronoi: 'Voronoi', geometric: 'Geometric',
  ascii: 'ASCII', mandala: 'Mandala', wave: 'Wave',
}

/** Bump when any family's output changes on purpose. v1 = main@22d6f4b (Flow Field jitter seeded in v2). */
export const ALGO_VERSION = 1

/** Canvas area above this fails on iOS Safari (about 16.7M px). */
export const MAX_PIXELS = 4096 * 4096

/** Salt mixed into the wall seed for the Flow Field start jitter (replaces v1 Math.random). */
export const JITTER_SALT = 0x6a09e667

/** Streamline columns drawn between checkpoints. Same as v1 CHUNK_ROWS; the call order depends on it. */
export const CHUNK_COLS = 12
export const CHUNK_ROWS = 12
