import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { addWall, cleanLabel, createCollection, deleteCollection, loadLibrary, moveWalls, removeWall, renameCollection, renameWall, restoreWall, saveLibrary, toggleFavorite, type KeyValueStorage } from '@/lib/library/local'
import { planSync } from '@/lib/library/sync'
import { createRemoteLibrary, isMissingTable } from '@/lib/library/remote'
import { EMPTY_LIBRARY, LIMITS, STORAGE_KEY, type Library } from '@/lib/library/types'
import { encodeWall } from '@/lib/wall/token'
import { parseUUID } from '@/lib/wall/params'

const tok = (u: string, fam = 'wave') => encodeWall(parseUUID(u, fam))
const T1 = tok('f47ac10b-58cc-4372-a567-0e02b2c3d479'), T2 = tok('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'voronoi'), T3 = tok('deadbeef-cafe-4abe-b00d-123456789abc', 'ascii')
const NOW = new Date('2026-10-28T00:00:00Z')
let n = 0; const id = () => `id${++n}`
const add = (lib: Library, token: string, fam = 'wave') => { const r = addWall(lib, { token, family: fam }, id(), NOW); if (r.status === 'full') throw new Error('full'); return r }
const memory = (init: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } => ({ data: { ...init }, getItem(k) { return this.data[k] ?? null }, setItem(k, v) { this.data[k] = v } })

describe('device library: operations', () => {
  it('adds a wall once per token; saving the same wall again reports it exists', () => {
    const a = add(EMPTY_LIBRARY, T1)
    expect(a.status).toBe('added'); expect(a.lib.walls).toHaveLength(1)
    const b = addWall(a.lib, { token: T1, family: 'wave' }, id(), NOW)
    expect(b.status).toBe('exists'); expect(b.lib.walls).toHaveLength(1)
  })
  it('newest first; stores no UUID, only the token and family', () => {
    let lib = add(EMPTY_LIBRARY, T1).lib
    lib = add(lib, T2, 'voronoi').lib
    expect(lib.walls.map(w => w.token)).toEqual([T2, T1])
    expect(JSON.stringify(lib)).not.toMatch(/f47ac10b|a1b2c3d4/)
  })
  it('caps at 500 walls and 50 collections', () => {
    const full: Library = { ...EMPTY_LIBRARY, walls: Array.from({ length: LIMITS.walls }, (_, i) => ({ id: `w${i}`, token: T1 + i, family: 'wave', label: null, isFavorite: false, collectionId: null, createdAt: NOW.toISOString() })) }
    expect(addWall(full, { token: T2, family: 'wave' }, 'x', NOW).status).toBe('full')
    let lib = EMPTY_LIBRARY
    for (let i = 0; i < LIMITS.collections; i++) lib = (createCollection(lib, `C${i}`, `c${i}`, NOW) as { lib: Library }).lib
    expect(createCollection(lib, 'one more', 'cx', NOW).status).toBe('full')
  })
  it('remove returns the wall and its place so Undo restores it exactly; undo is a no-op if re-saved meanwhile', () => {
    const lib = add(add(add(EMPTY_LIBRARY, T1).lib, T2, 'voronoi').lib, T3, 'ascii').lib
    const target = lib.walls[1]
    const r = removeWall(lib, target.id)
    expect(r.lib.walls.map(w => w.token)).toEqual([T3, T1])
    expect(restoreWall(r.lib, r.removed!, r.index)).toEqual(lib)
    const again = add(r.lib, T2, 'voronoi').lib
    expect(restoreWall(again, r.removed!, r.index)).toBe(again)
    expect(removeWall(lib, 'nope').removed).toBeNull()
  })
  it('rename trims and collapses spaces, empty clears it, long names are cut at 80', () => {
    let lib = add(EMPTY_LIBRARY, T1).lib; const wid = lib.walls[0].id
    lib = renameWall(lib, wid, '  My   desktop  '); expect(lib.walls[0].label).toBe('My desktop')
    lib = renameWall(lib, wid, '   '); expect(lib.walls[0].label).toBeNull()
    expect(cleanLabel('x'.repeat(200))).toHaveLength(LIMITS.label)
    expect(renameWall(lib, 'missing', 'a')).toBe(lib)
  })
  it('favourite toggles', () => {
    let lib = add(EMPTY_LIBRARY, T1).lib; const wid = lib.walls[0].id
    lib = toggleFavorite(lib, wid); expect(lib.walls[0].isFavorite).toBe(true)
    lib = toggleFavorite(lib, wid); expect(lib.walls[0].isFavorite).toBe(false)
  })
  it('collections: unique names (case-insensitive), move walls, deleting keeps the walls', () => {
    let lib = add(add(EMPTY_LIBRARY, T1).lib, T2, 'voronoi').lib
    const c = createCollection(lib, ' Desktop ', 'c1', NOW)
    expect(c.status).toBe('created'); lib = c.lib
    expect(createCollection(lib, 'desktop', 'c2', NOW).status).toBe('exists')
    expect(createCollection(lib, '   ', 'c3', NOW).status).toBe('invalid')
    lib = moveWalls(lib, [lib.walls[0].id], 'c1'); expect(lib.walls[0].collectionId).toBe('c1')
    expect(moveWalls(lib, [lib.walls[1].id], 'nope')).toBe(lib)
    expect(renameCollection(lib, 'c1', 'Phone').status).toBe('renamed')
    lib = deleteCollection(lib, 'c1')
    expect(lib.collections).toHaveLength(0); expect(lib.walls).toHaveLength(2); expect(lib.walls.every(w => w.collectionId === null)).toBe(true)
  })
})

describe('device library: storage', () => {
  it('round-trips through localStorage under uw_walls_v1', () => {
    const s = memory(); const lib = add(EMPTY_LIBRARY, T1).lib
    expect(saveLibrary(s, lib)).toBe(true)
    expect(Object.keys(s.data)).toEqual([STORAGE_KEY])
    expect(loadLibrary(s)).toEqual(lib)
  })
  it('corrupt, wrong-version, empty and missing storage all give an empty library, never an exception', () => {
    for (const raw of ['{not json', 'null', '[]', '{"version":2}', '{"version":1,"walls":"x"}', '']) expect(loadLibrary(memory({ [STORAGE_KEY]: raw }))).toEqual(EMPTY_LIBRARY)
    expect(loadLibrary(memory())).toEqual(EMPTY_LIBRARY)
    expect(loadLibrary(null)).toEqual(EMPTY_LIBRARY)
  })
  it('drops invalid items (bad token, unknown family, bad dates), duplicate tokens, and dangling collection ids', () => {
    const good = add(EMPTY_LIBRARY, T1).lib.walls[0]
    const raw = JSON.stringify({ version: 1, collections: [{ id: 'c1', name: 'A', createdAt: NOW.toISOString() }, { id: '', name: 'bad', createdAt: NOW.toISOString() }], walls: [
      good, { ...good, id: 'dup' }, { ...good, id: 'b', token: 'AAAAAAAAAAAAAAAAAA' }, { ...good, id: 'c', token: T2, family: 'plasma' }, { ...good, id: 'd', token: T3, createdAt: 'nope' },
      { ...good, id: 'e', token: tok('00000000-0000-0000-0000-000000000000'), collectionId: 'ghost' },
    ] })
    const lib = loadLibrary(memory({ [STORAGE_KEY]: raw }))
    expect(lib.collections.map(c => c.id)).toEqual(['c1'])
    expect(lib.walls.map(w => w.id)).toEqual([good.id, 'e'])
    expect(lib.walls[1].collectionId).toBeNull()
  })
  it('reports a refused write (quota, private mode) instead of throwing', () => {
    const s: KeyValueStorage = { getItem: () => null, setItem: () => { throw new DOMException('full', 'QuotaExceededError') } }
    expect(saveLibrary(s, EMPTY_LIBRARY)).toBe(false)
    expect(saveLibrary(null, EMPTY_LIBRARY)).toBe(false)
  })
})

describe('sync: merging the device library with the account', () => {
  const mk = (walls: Array<[string, Partial<Library['walls'][0]>?]>, collections: Library['collections'] = []): Library => ({ version: 1, collections, walls: walls.map(([token, p], i) => ({ id: `id-${token.slice(0, 3)}-${i}`, token, family: 'wave', label: null, isFavorite: false, collectionId: null, createdAt: `2026-10-0${i + 1}T00:00:00Z`, ...p })) })
  it('union by token; device-only walls are pushed; nothing is lost', () => {
    const p = planSync(mk([[T1], [T2]]), mk([[T2], [T3]]))
    expect(p.merged.walls.map(w => w.token).sort()).toEqual([T1, T2, T3].sort())
    expect(p.pushWalls.map(w => w.token)).toEqual([T1])
  })
  it('favourite is either side, label prefers the account, earliest createdAt, account id wins', () => {
    const local = mk([[T1, { isFavorite: true, label: 'Mine', createdAt: '2026-01-01T00:00:00Z', id: 'L' }]])
    const remote = mk([[T1, { label: 'Theirs', createdAt: '2026-02-01T00:00:00Z', id: 'R' }]])
    const w = planSync(local, remote).merged.walls[0]
    expect(w).toMatchObject({ id: 'R', isFavorite: true, label: 'Theirs', createdAt: '2026-01-01T00:00:00Z' })
  })
  it('device label survives when the account has none, and that change is sent up', () => {
    const p = planSync(mk([[T1, { label: 'Mine' }]]), mk([[T1]]))
    expect(p.merged.walls[0].label).toBe('Mine'); expect(p.updateWalls).toHaveLength(1)
  })
  it('collections match by name case-insensitively and walls follow them', () => {
    const local = mk([[T1, { collectionId: 'lc' }]], [{ id: 'lc', name: 'desktop', createdAt: NOW.toISOString() }])
    const remote = mk([], [{ id: 'rc', name: 'Desktop', createdAt: NOW.toISOString() }])
    const p = planSync(local, remote)
    expect(p.merged.collections).toHaveLength(1); expect(p.pushCollections).toHaveLength(0)
    expect(p.merged.walls[0].collectionId).toBe('rc')
  })
  it('is idempotent: syncing the merged result again changes nothing', () => {
    const local = mk([[T1, { isFavorite: true }], [T2]], [{ id: 'lc', name: 'Phone', createdAt: NOW.toISOString() }])
    const remote = mk([[T2, { label: 'x' }], [T3]])
    const once = planSync(local, remote).merged
    const twice = planSync(once, once)
    expect(twice.merged).toEqual(once); expect(twice.pushWalls).toHaveLength(0); expect(twice.updateWalls).toHaveLength(0)
  })
})

describe('account library (Supabase): missing-table guard', () => {
  const dbReturning = (result: unknown) => {
    const chain: Record<string, unknown> = {}
    const q = { select: () => q, order: () => Promise.resolve(result), upsert: () => Promise.resolve(result), delete: () => ({ eq: () => Promise.resolve(result) }) }
    void chain
    return { from: vi.fn(() => q) } as never
  }
  it('recognises the errors PostgREST and Postgres give for a table that does not exist', () => {
    expect(isMissingTable({ code: 'PGRST205', message: "Could not find the table 'public.saved_walls' in the schema cache" })).toBe(true)
    expect(isMissingTable({ code: '42P01', message: 'relation "public.saved_walls" does not exist' })).toBe(true)
    expect(isMissingTable({ message: 'Could not find the table public.collections' })).toBe(true)
    expect(isMissingTable({ code: '23505', message: 'duplicate key' })).toBe(false)
    expect(isMissingTable(null)).toBe(false)
  })
  it('a missing table is "unavailable", a real failure is "error", success carries the data', async () => {
    const missing = { data: null, error: { code: 'PGRST205', message: 'Could not find the table' } }
    expect(await createRemoteLibrary(dbReturning(missing), 'u1').fetchAll()).toEqual({ ok: false, reason: 'unavailable' })
    expect(await createRemoteLibrary(dbReturning({ data: null, error: { code: '500', message: 'boom' } }), 'u1').fetchAll()).toEqual({ ok: false, reason: 'error' })
    const rows = { error: null, data: [{ id: 'a', wall_token: T1, family: 'wave', label: null, is_favorite: true, collection_id: null, created_at: NOW.toISOString() }, { id: 'bad', wall_token: 'AAAAAAAAAAAAAAAAAA', family: 'wave', label: null, is_favorite: false, collection_id: null, created_at: NOW.toISOString() }] }
    const ok = await createRemoteLibrary(dbReturning(rows), 'u1').fetchAll()
    expect(ok.ok && ok.data.walls.map(w => [w.id, w.isFavorite])).toEqual([['a', true]]) // the row this build cannot render is skipped
  })
  it('writes with nothing to write do not call the database', async () => {
    const db = dbReturning({ error: null })
    const r = createRemoteLibrary(db, 'u1')
    expect(await r.upsertWalls([])).toEqual({ ok: true, data: null })
    expect(await r.upsertCollections([])).toEqual({ ok: true, data: null })
    expect((db as unknown as { from: ReturnType<typeof vi.fn> }).from).not.toHaveBeenCalled()
  })
})

describe('migration file', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261028000000_saved_collections.sql', import.meta.url), 'utf8')
  const remoteSrc = readFileSync(new URL('../lib/library/remote.ts', import.meta.url), 'utf8')
  it('has every column the remote layer reads or writes', () => {
    for (const col of ['id', 'user_id', 'wall_token', 'family', 'algo_version', 'label', 'is_favorite', 'collection_id', 'created_at', 'name']) {
      expect(remoteSrc).toContain(col)
      expect(sql).toMatch(new RegExp(`\\b${col}\\b`))
    }
    expect(sql).toMatch(/is_favorite\s+boolean not null default false/)
    expect(sql).toMatch(/unique \(user_id, wall_token\)/)
  })
  it('is owner-only: RLS on, owner policies, no anon access, token length matches the codec, and is re-runnable', () => {
    expect(sql).toMatch(/alter table public\.saved_walls enable row level security/)
    expect(sql).toMatch(/alter table public\.collections enable row level security/)
    expect(sql.match(/for all to authenticated/g)).toHaveLength(2)
    expect(sql).not.toMatch(/\banon\b/)
    expect(sql).toMatch(/char_length\(wall_token\) = 18/)
    expect(sql).toMatch(/create table if not exists public\.saved_walls/)
    expect(sql).toMatch(/drop policy if exists/)
  })
  it('does not touch the payments tables', () => { expect(sql).not.toMatch(/paid_users/) })
})
