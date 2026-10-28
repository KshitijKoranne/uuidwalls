import { FAMS } from '@/lib/wall/constants'
import { decodeWall } from '@/lib/wall/token'
import { EMPTY_LIBRARY, LIMITS, STORAGE_KEY, type Collection, type Library, type SavedWall } from './types'

// The device library: plain data in localStorage (key uw_walls_v1) plus pure functions that return a
// new Library. Nothing here touches the network, so the library works signed out, offline, and on a
// preview deployment. Sync to Supabase is layered on top (remote.ts, sync.ts) and optional.

export interface KeyValueStorage { getItem(k: string): string | null; setItem(k: string, v: string): void }

const str = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max
const isIso = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))

function validWall(w: unknown): w is SavedWall {
  if (!w || typeof w !== 'object') return false
  const x = w as Record<string, unknown>
  return str(x.id, 64) && x.id !== '' && typeof x.token === 'string' && decodeWall(x.token) !== null
    && typeof x.family === 'string' && (FAMS as readonly string[]).includes(x.family)
    && (x.label === null || str(x.label, LIMITS.label)) && typeof x.isFavorite === 'boolean'
    && (x.collectionId === null || str(x.collectionId, 64)) && isIso(x.createdAt)
}
const validCollection = (c: unknown): c is Collection => {
  if (!c || typeof c !== 'object') return false
  const x = c as Record<string, unknown>
  return str(x.id, 64) && x.id !== '' && str(x.name, LIMITS.collectionName) && x.name.trim() !== '' && isIso(x.createdAt)
}

/** Read the library. Anything unreadable or invalid is dropped, never thrown: a corrupt key must not break the page. */
export function loadLibrary(storage: KeyValueStorage | null): Library {
  if (!storage) return EMPTY_LIBRARY
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_LIBRARY
    const data = JSON.parse(raw) as Partial<Library>
    if (!data || data.version !== 1) return EMPTY_LIBRARY
    const collections = (Array.isArray(data.collections) ? data.collections : []).filter(validCollection).slice(0, LIMITS.collections)
    const ids = new Set(collections.map(c => c.id))
    const seen = new Set<string>()
    const walls = (Array.isArray(data.walls) ? data.walls : []).filter(validWall).filter(w => !seen.has(w.token) && !!seen.add(w.token))
      .slice(0, LIMITS.walls).map(w => (w.collectionId && !ids.has(w.collectionId) ? { ...w, collectionId: null } : w))
    return { version: 1, walls, collections }
  } catch { return EMPTY_LIBRARY }
}

/** Write the library. Returns false if the browser refused (quota, private mode); the caller tells the user. */
export function saveLibrary(storage: KeyValueStorage | null, lib: Library): boolean {
  if (!storage) return false
  try { storage.setItem(STORAGE_KEY, JSON.stringify(lib)); return true } catch { return false }
}

// ── pure operations ──────────────────────────────────────────────────────────

export type AddResult = { lib: Library; status: 'added'; wall: SavedWall } | { lib: Library; status: 'exists'; wall: SavedWall } | { lib: Library; status: 'full' }

export function addWall(lib: Library, input: { token: string; family: string; label?: string | null; collectionId?: string | null }, id: string, now: Date): AddResult {
  const existing = lib.walls.find(w => w.token === input.token)
  if (existing) return { lib, status: 'exists', wall: existing }
  if (lib.walls.length >= LIMITS.walls) return { lib, status: 'full' }
  const collectionId = input.collectionId && lib.collections.some(c => c.id === input.collectionId) ? input.collectionId : null
  const wall: SavedWall = { id, token: input.token, family: input.family, label: cleanLabel(input.label), isFavorite: false, collectionId, createdAt: now.toISOString() }
  return { lib: { ...lib, walls: [wall, ...lib.walls] }, status: 'added', wall }
}

export const cleanLabel = (v: string | null | undefined): string | null => {
  const t = (v ?? '').replace(/\s+/g, ' ').trim().slice(0, LIMITS.label)
  return t === '' ? null : t
}

/** Returns the removed wall too, so the UI can offer Undo. */
export function removeWall(lib: Library, id: string): { lib: Library; removed: SavedWall | null; index: number } {
  const index = lib.walls.findIndex(w => w.id === id)
  if (index < 0) return { lib, removed: null, index: -1 }
  return { lib: { ...lib, walls: lib.walls.filter(w => w.id !== id) }, removed: lib.walls[index], index }
}

/** Undo a removal, back in its old position. A no-op if the token was saved again meanwhile. */
export function restoreWall(lib: Library, wall: SavedWall, index: number): Library {
  if (lib.walls.some(w => w.token === wall.token || w.id === wall.id)) return lib
  const walls = lib.walls.slice(); walls.splice(Math.min(Math.max(index, 0), walls.length), 0, wall)
  const collectionId = wall.collectionId && lib.collections.some(c => c.id === wall.collectionId) ? wall.collectionId : null
  walls[walls.indexOf(wall)] = { ...wall, collectionId }
  return { ...lib, walls }
}

const patchWall = (lib: Library, id: string, patch: Partial<SavedWall>): Library =>
  lib.walls.some(w => w.id === id) ? { ...lib, walls: lib.walls.map(w => (w.id === id ? { ...w, ...patch } : w)) } : lib

export const renameWall = (lib: Library, id: string, label: string | null) => patchWall(lib, id, { label: cleanLabel(label) })
export const toggleFavorite = (lib: Library, id: string) => patchWall(lib, id, { isFavorite: !lib.walls.find(w => w.id === id)?.isFavorite })

export function moveWalls(lib: Library, ids: string[], collectionId: string | null): Library {
  if (collectionId !== null && !lib.collections.some(c => c.id === collectionId)) return lib
  const set = new Set(ids)
  return { ...lib, walls: lib.walls.map(w => (set.has(w.id) ? { ...w, collectionId } : w)) }
}

export const cleanCollectionName = (v: string) => v.replace(/\s+/g, ' ').trim().slice(0, LIMITS.collectionName)

export type CollectionResult = { lib: Library; status: 'created'; collection: Collection } | { lib: Library; status: 'exists' | 'invalid' | 'full' }

export function createCollection(lib: Library, name: string, id: string, now: Date): CollectionResult {
  const n = cleanCollectionName(name)
  if (n === '') return { lib, status: 'invalid' }
  if (lib.collections.some(c => c.name.toLowerCase() === n.toLowerCase())) return { lib, status: 'exists' }
  if (lib.collections.length >= LIMITS.collections) return { lib, status: 'full' }
  const collection: Collection = { id, name: n, createdAt: now.toISOString() }
  return { lib: { ...lib, collections: [...lib.collections, collection] }, status: 'created', collection }
}

export function renameCollection(lib: Library, id: string, name: string): { lib: Library; status: 'renamed' | 'exists' | 'invalid' | 'missing' } {
  const n = cleanCollectionName(name)
  if (n === '') return { lib, status: 'invalid' }
  if (!lib.collections.some(c => c.id === id)) return { lib, status: 'missing' }
  if (lib.collections.some(c => c.id !== id && c.name.toLowerCase() === n.toLowerCase())) return { lib, status: 'exists' }
  return { lib: { ...lib, collections: lib.collections.map(c => (c.id === id ? { ...c, name: n } : c)) }, status: 'renamed' }
}

/** Deleting a collection keeps its walls; they go back to "no collection". */
export function deleteCollection(lib: Library, id: string): Library {
  return { ...lib, collections: lib.collections.filter(c => c.id !== id), walls: lib.walls.map(w => (w.collectionId === id ? { ...w, collectionId: null } : w)) }
}
