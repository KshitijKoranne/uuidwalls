'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { ACCOUNTS_ENABLED } from '@/lib/env'
import { addWall, createCollection, deleteCollection, loadLibrary, moveWalls, removeWall, renameCollection, renameWall, restoreWall, saveLibrary, toggleFavorite } from '@/lib/library/local'
import { createRemoteLibrary, type RemoteLibrary } from '@/lib/library/remote'
import { planSync } from '@/lib/library/sync'
import { EMPTY_LIBRARY, type Library, type SavedWall } from '@/lib/library/types'

export type SyncState = 'off' | 'syncing' | 'synced' | 'unavailable' | 'error'
const ACK_KEY = 'uw_sync_ack'

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`)
const storage = () => { try { return typeof window === 'undefined' ? null : window.localStorage } catch { return null } }

/**
 * The library: device first (works signed out, offline, on previews), account sync on top when signed in
 * and the tables exist. Signing in never merges silently: if this device has walls the account does not,
 * `mergePrompt` asks first (SPEC 8.8). Every sync failure leaves the device copy intact.
 */
export function useLibrary(user: User | null) {
  const [lib, setLibState] = useState<Library>(EMPTY_LIBRARY)
  const [ready, setReady] = useState(false)
  const [sync, setSync] = useState<SyncState>('off')
  const [mergePrompt, setMergePrompt] = useState<{ count: number } | null>(null)
  const libRef = useRef(lib)
  const remote = useRef<RemoteLibrary | null>(null)
  const plan = useRef<ReturnType<typeof planSync> | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)

  const apply = useCallback((next: Library) => {
    libRef.current = next; setLibState(next)
    setSaveFailed(!saveLibrary(storage(), next))
  }, [])

  useEffect(() => { // load once on the client; localStorage does not exist on the server
    const l = loadLibrary(storage()); libRef.current = l
    const t = setTimeout(() => { setLibState(l); setReady(true) }, 0)
    return () => clearTimeout(t)
  }, [])

  // ── sync with the account ──────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(async () => {
      if (!user || !ACCOUNTS_ENABLED) { remote.current = null; setSync('off'); return }
      setSync('syncing')
      const r = createRemoteLibrary(createClient(), user.id)
      const res = await r.fetchAll()
      if (!res.ok) { remote.current = null; setSync(res.reason === 'unavailable' ? 'unavailable' : 'error'); return }
      const p = planSync(libRef.current, res.data)
      const localOnly = p.pushWalls.length + p.pushCollections.length
      const ack = storage()?.getItem(ACK_KEY)
      if (localOnly > 0 && ack !== 'yes') {
        plan.current = p
        if (ack !== 'no') setMergePrompt({ count: p.pushWalls.length })
        setSync('off') // device copy only until the user agrees
        return
      }
      remote.current = r
      apply(p.merged); setSync('synced')
    }, 0)
    return () => clearTimeout(t)
  }, [user, ready, apply])

  const acceptMerge = useCallback(async () => {
    const p = plan.current; if (!p || !user) return
    setMergePrompt(null); setSync('syncing')
    const r = createRemoteLibrary(createClient(), user.id)
    const a = await r.upsertCollections(p.pushCollections), b = a.ok ? await r.upsertWalls([...p.pushWalls, ...p.updateWalls]) : a
    if (!b.ok) { setSync(b.reason === 'unavailable' ? 'unavailable' : 'error'); return }
    storage()?.setItem(ACK_KEY, 'yes')
    remote.current = r; apply(p.merged); setSync('synced')
  }, [user, apply])
  const declineMerge = useCallback(() => { storage()?.setItem(ACK_KEY, 'no'); setMergePrompt(null) }, [])

  const push = useCallback(async (job: (r: RemoteLibrary) => Promise<{ ok: boolean }>) => {
    const r = remote.current; if (!r) return
    const res = await job(r)
    if (!res.ok) setSync('error')
  }, [])

  // ── actions ────────────────────────────────────────────────────────────────
  const saveWall = useCallback((token: string, family: string): { status: 'added' | 'exists' | 'full'; wall?: SavedWall } => {
    const r = addWall(libRef.current, { token, family }, newId(), new Date())
    if (r.status === 'added') { apply(r.lib); void push(x => x.upsertWalls([r.wall])) }
    return r.status === 'full' ? { status: 'full' } : { status: r.status, wall: r.wall }
  }, [apply, push])

  const removeWallById = useCallback((id: string) => {
    const r = removeWall(libRef.current, id)
    if (r.removed) { apply(r.lib); void push(x => x.deleteWall(id)) }
    return r
  }, [apply, push])
  const undoRemove = useCallback((wall: SavedWall, index: number) => {
    apply(restoreWall(libRef.current, wall, index)); void push(x => x.upsertWalls([wall]))
  }, [apply, push])

  const update = useCallback((next: Library, ids: string[]) => {
    apply(next); const walls = next.walls.filter(w => ids.includes(w.id)); void push(x => x.upsertWalls(walls))
  }, [apply, push])
  const rename = useCallback((id: string, label: string | null) => update(renameWall(libRef.current, id, label), [id]), [update])
  const favorite = useCallback((id: string) => update(toggleFavorite(libRef.current, id), [id]), [update])
  const move = useCallback((ids: string[], collectionId: string | null) => update(moveWalls(libRef.current, ids, collectionId), ids), [update])

  const addCollection = useCallback((name: string) => {
    const r = createCollection(libRef.current, name, newId(), new Date())
    if (r.status === 'created') { apply(r.lib); void push(x => x.upsertCollections([r.collection])) }
    return r
  }, [apply, push])
  const renameCol = useCallback((id: string, name: string) => {
    const r = renameCollection(libRef.current, id, name)
    if (r.status === 'renamed') { apply(r.lib); const c = r.lib.collections.find(x => x.id === id); if (c) void push(x => x.upsertCollections([c])) }
    return r.status
  }, [apply, push])
  const removeCol = useCallback((id: string) => {
    const affected = libRef.current.walls.filter(w => w.collectionId === id).map(w => w.id)
    const next = deleteCollection(libRef.current, id); apply(next)
    void push(async x => { const a = await x.deleteCollection(id); return a.ok && affected.length ? x.upsertWalls(next.walls.filter(w => affected.includes(w.id))) : a })
  }, [apply, push])

  const tokens = useMemo(() => new Map(lib.walls.map(w => [w.token, w])), [lib.walls])
  return { lib, ready, sync, saveFailed, mergePrompt, acceptMerge, declineMerge, tokens, saveWall, removeWall: removeWallById, undoRemove, rename, favorite, move, addCollection, renameCollection: renameCol, removeCollection: removeCol }
}
