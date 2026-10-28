import type { Collection, Library, SavedWall } from './types'
import { LIMITS } from './types'

export interface SyncPlan {
  /** What the device should now show (union of both sides). */
  merged: Library
  /** Only on this device: send to the account. */
  pushWalls: SavedWall[]
  pushCollections: Collection[]
  /** Both exist but differ: send the merged version. */
  updateWalls: SavedWall[]
}

/**
 * Merge a device library with an account library. Rules, chosen so nothing the user saved is lost and
 * repeated syncs settle (merge(merge(a,b), b) == merge(a,b)):
 *  - walls are the same wall when the token matches; the earlier createdAt and the account's id win
 *  - favourite = either side; label = the account's if it has one, else the device's
 *  - collections match by name, case-insensitive; the account's id wins
 *  - a wall's collection follows the matched collection; unknown collection -> none
 * Deletions are NOT propagated by merge (an item missing on one side is treated as new on the other);
 * deleting while signed in is done on both sides by the caller.
 */
export function planSync(local: Library, remote: Library): SyncPlan {
  const collections: Collection[] = [...remote.collections]
  const idMap = new Map<string, string>() // local collection id -> merged id
  const pushCollections: Collection[] = []
  for (const c of local.collections) {
    const match = collections.find(r => r.name.toLowerCase() === c.name.toLowerCase())
    if (match) idMap.set(c.id, match.id)
    else if (collections.length < LIMITS.collections) { collections.push(c); idMap.set(c.id, c.id); pushCollections.push(c) }
  }
  const knownIds = new Set(collections.map(c => c.id))
  const mapCollection = (id: string | null, fromLocal: boolean) => {
    if (id === null) return null
    const m = fromLocal ? idMap.get(id) : id
    return m && knownIds.has(m) ? m : null
  }

  const byToken = new Map<string, SavedWall>()
  const pushWalls: SavedWall[] = [], updateWalls: SavedWall[] = []
  for (const r of remote.walls) byToken.set(r.token, { ...r, collectionId: mapCollection(r.collectionId, false) })
  for (const l of local.walls) {
    const r = byToken.get(l.token)
    if (!r) {
      if (byToken.size < LIMITS.walls) { const w = { ...l, collectionId: mapCollection(l.collectionId, true) }; byToken.set(l.token, w); pushWalls.push(w) }
      continue
    }
    const merged: SavedWall = {
      ...r,
      createdAt: Date.parse(l.createdAt) < Date.parse(r.createdAt) ? l.createdAt : r.createdAt,
      isFavorite: r.isFavorite || l.isFavorite,
      label: r.label ?? l.label,
      collectionId: r.collectionId ?? mapCollection(l.collectionId, true),
    }
    const remoteOriginal = remote.walls.find(x => x.token === l.token)!
    if (merged.isFavorite !== remoteOriginal.isFavorite || merged.label !== remoteOriginal.label || merged.collectionId !== remoteOriginal.collectionId) updateWalls.push(merged)
    byToken.set(l.token, merged)
  }
  const walls = [...byToken.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  return { merged: { version: 1, walls, collections }, pushWalls, pushCollections, updateWalls }
}
