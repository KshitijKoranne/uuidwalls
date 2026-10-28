export interface SavedWall {
  id: string
  /** Wall token (lib/wall/token.ts): the wall's look, never a device UUID. */
  token: string
  family: string
  /** User rename. null = use the deterministic name. */
  label: string | null
  isFavorite: boolean
  collectionId: string | null
  createdAt: string
}

export interface Collection { id: string; name: string; createdAt: string }

export interface Library { version: 1; walls: SavedWall[]; collections: Collection[] }

export const EMPTY_LIBRARY: Library = { version: 1, walls: [], collections: [] }

export const LIMITS = { walls: 500, collections: 50, label: 80, collectionName: 60 } as const
export const STORAGE_KEY = 'uw_walls_v1'
