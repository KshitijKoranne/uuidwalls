import type { SupabaseClient } from '@supabase/supabase-js'
import { FAMS } from '@/lib/wall/constants'
import { decodeWall } from '@/lib/wall/token'
import { ALGO_VERSION } from '@/lib/wall/constants'
import type { Collection, Library, SavedWall } from './types'

// The account library in Supabase (tables from supabase/migrations/20261028000000_saved_collections.sql).
// Every call returns a result instead of throwing, and a missing table is reported as 'unavailable' so
// the app stays fully usable on the device library until the owner applies the migration.

export type Remote<T> = { ok: true; data: T } | { ok: false; reason: 'unavailable' | 'error' }

type PgError = { code?: string; message?: string; status?: number } | null | undefined

/** PostgREST says PGRST205 / 404 when a table is not in its schema cache; Postgres says 42P01 (undefined_table). */
export function isMissingTable(e: PgError): boolean {
  if (!e) return false
  return e.code === 'PGRST205' || e.code === '42P01' || /Could not find the table|relation .* does not exist/i.test(e.message ?? '')
}

const fail = <T>(e: PgError): Remote<T> => ({ ok: false, reason: isMissingTable(e) ? 'unavailable' : 'error' })

interface WallRow { id: string; wall_token: string; family: string; label: string | null; is_favorite: boolean; collection_id: string | null; created_at: string }
interface CollectionRow { id: string; name: string; created_at: string }

const wallFromRow = (r: WallRow): SavedWall | null =>
  decodeWall(r.wall_token) && (FAMS as readonly string[]).includes(r.family)
    ? { id: r.id, token: r.wall_token, family: r.family, label: r.label, isFavorite: r.is_favorite, collectionId: r.collection_id, createdAt: r.created_at }
    : null // a row this build cannot render (newer algorithm, hand-edited) is skipped, not shown broken

const wallToRow = (userId: string, w: SavedWall) => ({
  id: w.id, user_id: userId, wall_token: w.token, family: w.family, algo_version: ALGO_VERSION, label: w.label, is_favorite: w.isFavorite, collection_id: w.collectionId, created_at: w.createdAt,
})

export function createRemoteLibrary(db: SupabaseClient, userId: string) {
  return {
    async fetchAll(): Promise<Remote<Library>> {
      const [c, w] = await Promise.all([
        db.from('collections').select('id,name,created_at').order('created_at', { ascending: true }),
        db.from('saved_walls').select('id,wall_token,family,label,is_favorite,collection_id,created_at').order('created_at', { ascending: false }),
      ])
      if (c.error) return fail(c.error)
      if (w.error) return fail(w.error)
      const collections: Collection[] = (c.data as CollectionRow[]).map(r => ({ id: r.id, name: r.name, createdAt: r.created_at }))
      const walls = (w.data as WallRow[]).map(wallFromRow).filter((x): x is SavedWall => x !== null)
      return { ok: true, data: { version: 1, walls, collections } }
    },
    async upsertCollections(list: Collection[]): Promise<Remote<null>> {
      if (list.length === 0) return { ok: true, data: null }
      const { error } = await db.from('collections').upsert(list.map(x => ({ id: x.id, user_id: userId, name: x.name, created_at: x.createdAt })), { onConflict: 'id' })
      return error ? fail(error) : { ok: true, data: null }
    },
    async upsertWalls(list: SavedWall[]): Promise<Remote<null>> {
      if (list.length === 0) return { ok: true, data: null }
      const { error } = await db.from('saved_walls').upsert(list.map(w => wallToRow(userId, w)), { onConflict: 'user_id,wall_token' })
      return error ? fail(error) : { ok: true, data: null }
    },
    async deleteWall(id: string): Promise<Remote<null>> {
      const { error } = await db.from('saved_walls').delete().eq('id', id)
      return error ? fail(error) : { ok: true, data: null }
    },
    async deleteCollection(id: string): Promise<Remote<null>> {
      const { error } = await db.from('collections').delete().eq('id', id)
      return error ? fail(error) : { ok: true, data: null }
    },
  }
}

export type RemoteLibrary = ReturnType<typeof createRemoteLibrary>
