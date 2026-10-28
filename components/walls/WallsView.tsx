'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useStudio } from '@/components/studio/context'
import { IconSearch } from '@/components/studio/icons'
import type { SavedWall } from '@/lib/library/types'
import { wallName } from '@/lib/wall/name'
import { decodeWall } from '@/lib/wall/token'
import WallCard, { type CardActions } from './WallCard'

type Sort = 'newest' | 'name' | 'fav'

const nameOf = (w: SavedWall) => w.label ?? (decodeWall(w.token) ? wallName(decodeWall(w.token)!) : 'Wall')

function EmptyArt() {
  return <svg className="art" viewBox="0 0 96 96" aria-hidden="true"><rect x="8" y="22" width="52" height="38" rx="8" fill="none" stroke="var(--wall-accent)" strokeWidth="2" opacity=".5" /><rect x="22" y="34" width="52" height="38" rx="8" fill="none" stroke="var(--wall-accent)" strokeWidth="2" opacity=".75" /><rect x="36" y="46" width="52" height="38" rx="8" fill="var(--surface-2)" stroke="var(--wall-accent)" strokeWidth="2" /></svg>
}

export default function WallsView() {
  const s = useStudio()
  const router = useRouter()
  const { lib, ready, sync } = s.library
  const [collection, setCollection] = useState<string | 'all' | 'fav'>('all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('newest')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [colError, setColError] = useState('')
  const [renaming, setRenaming] = useState(false)

  useEffect(() => { // ?c=<collection id> in the address bar
    const t = setTimeout(() => { const c = new URLSearchParams(window.location.search).get('c'); if (c) setCollection(c) }, 0)
    return () => clearTimeout(t)
  }, [])
  const pick = (c: string) => { setCollection(c); setRenaming(false); history.replaceState(null, '', c === 'all' || c === 'fav' ? '/walls' : `/walls?c=${c}`) }

  const activeCol = lib.collections.find(c => c.id === collection)
  const view = useMemo(() => {
    let list = lib.walls
    if (collection === 'fav') list = list.filter(w => w.isFavorite)
    else if (collection !== 'all') list = list.filter(w => w.collectionId === collection)
    const needle = q.trim().toLowerCase()
    if (needle) list = list.filter(w => nameOf(w).toLowerCase().includes(needle))
    const sorted = [...list]
    if (sort === 'name') sorted.sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
    else if (sort === 'fav') sorted.sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || Date.parse(b.createdAt) - Date.parse(a.createdAt))
    return sorted
  }, [lib.walls, collection, q, sort])

  const actions: CardActions = {
    open: w => { if (s.loadToken(w.token, { fromWalls: true })) router.push('/') },
    favorite: w => { s.library.favorite(w.id); s.showToast(w.isFavorite ? 'Removed from Favourites' : 'Added to Favourites') },
    rename: (w, label) => s.library.rename(w.id, label),
    move: (w, id) => { s.library.move([w.id], id); s.showToast(id ? 'Added to collection' : 'Removed from collection') },
    copyLink: async w => { try { await navigator.clipboard.writeText(`${window.location.origin}/w/${w.token}`); s.showToast('Link copied. It doesn’t include your UUID.') } catch { s.showToast('Couldn’t copy the link.', { error: true }) } },
    remove: w => { const r = s.library.removeWall(w.id); if (r.removed) s.showToast(`Deleted “${nameOf(w)}”.`, { actions: [{ label: 'Undo', run: () => s.library.undoRemove(r.removed!, r.index) }] }) },
  }

  function createCol() {
    const r = s.library.addCollection(newName)
    if (r.status === 'created') { setCreating(false); setNewName(''); setColError(''); pick(r.collection.id) }
    else setColError(r.status === 'exists' ? 'You already have a collection with that name.' : r.status === 'full' ? 'You have 50 collections, the most we keep.' : 'Give it a name.')
  }

  const syncText = sync === 'synced' ? 'Synced to your account' : sync === 'syncing' ? 'Syncing…' : 'Saved on this device'
  const total = lib.walls.length
  const empty = ready && view.length === 0

  return (
    <main id="main" tabIndex={-1} className="page">
      <div className="head">
        <div>
          <h1>My walls</h1>
          <p className="caption" style={{ marginTop: 4 }}>{total} saved</p>
        </div>
        <span className={`sync${sync === 'synced' ? ' on' : ''}`} role="status"><i />{syncText}{s.user ? '' : s.accountsEnabled ? ' · ' : ''}{!s.user && s.accountsEnabled && <button type="button" className="btn ghost sm" onClick={() => s.openDialog({ kind: 'signin', trigger: 'sync' })}>Sign in to sync</button>}</span>
      </div>

      {s.user && sync === 'unavailable' && <div className="banner page-banner info" role="region" aria-label="Sync" style={{ margin: '0 0 16px' }}>Syncing is unavailable right now. Your walls are safe on this device.</div>}
      {s.user && sync === 'error' && <div className="banner page-banner warn" role="region" aria-label="Sync" style={{ margin: '0 0 16px' }}>Couldn’t sync. Your walls are safe on this device.</div>}
      {s.library.saveFailed && <div className="banner page-banner warn" role="alert" style={{ margin: '0 0 16px' }}>Your browser wouldn’t let us save on this device (storage full or private mode). New changes may be lost when you close the tab.</div>}

      <div className="toolbar">
        <div className="chips">
          <div role="tablist" aria-label="Filter" style={{ display: 'contents' }}>
          {[{ id: 'all', label: 'All', n: total }, { id: 'fav', label: 'Favourites', n: lib.walls.filter(w => w.isFavorite).length }, ...lib.collections.map(c => ({ id: c.id, label: c.name, n: lib.walls.filter(w => w.collectionId === c.id).length }))].map(c => (
            <button key={c.id} type="button" role="tab" className="chip" aria-selected={collection === c.id} onClick={() => pick(c.id)}>{c.label} <span className="n">{c.n}</span></button>
          ))}
          </div>
          {creating
            ? <span className="newcol"><input aria-label="Collection name" autoFocus placeholder="Name" value={newName} maxLength={60} aria-invalid={!!colError} onChange={e => { setNewName(e.target.value); setColError('') }} onKeyDown={e => { if (e.key === 'Enter') createCol(); if (e.key === 'Escape') { setCreating(false); setColError('') } }} /><button className="btn sm" type="button" onClick={createCol}>Create</button><button className="btn ghost sm" type="button" onClick={() => { setCreating(false); setColError('') }}>Cancel</button></span>
            : <button type="button" className="chip dash" onClick={() => setCreating(true)}>+ New collection</button>}
        </div>
        <div className="search"><IconSearch /><input type="search" aria-label="Search walls" placeholder="Search" value={q} onChange={e => setQ(e.target.value)} /></div>
        <label className="sr" htmlFor="sort">Sort</label>
        <select id="sort" className="sort" value={sort} onChange={e => setSort(e.target.value as Sort)}><option value="newest">Newest</option><option value="name">Name</option><option value="fav">Favourites first</option></select>
      </div>
      {colError && <div className="helper err" role="alert" style={{ marginTop: -12, marginBottom: 16 }}>{colError}</div>}

      {activeCol && (
        <div className="toolbar" style={{ marginTop: -8 }}>
          {renaming
            ? <span className="newcol"><input aria-label="Collection name" autoFocus defaultValue={activeCol.name} maxLength={60} onKeyDown={e => { if (e.key === 'Enter') { const r = s.library.renameCollection(activeCol.id, e.currentTarget.value); if (r === 'renamed') setRenaming(false); else setColError(r === 'exists' ? 'You already have a collection with that name.' : 'Give it a name.') } if (e.key === 'Escape') setRenaming(false) }} /><button className="btn ghost sm" type="button" onClick={() => setRenaming(false)}>Cancel</button></span>
            : <><button className="btn sm" type="button" onClick={() => setRenaming(true)}>Rename “{activeCol.name}”</button>
              <button className="btn sm" type="button" onClick={() => { const n = activeCol.name; s.library.removeCollection(activeCol.id); pick('all'); s.showToast(`Deleted collection “${n}”. Its walls stay in All.`) }}>Delete collection</button></>}
        </div>
      )}

      {!ready && <ul className="grid" aria-busy="true" aria-label="Loading">{Array.from({ length: 8 }, (_, i) => <li key={i} className="card skel" style={{ listStyle: 'none' }}><div className="thumb sk" /><div className="meta"><div className="t"><div className="l sk" style={{ width: '60%' }} /><div className="l sk" style={{ width: '40%' }} /></div></div></li>)}</ul>}

      {ready && view.length > 0 && <ul className="grid">{view.map(w => <WallCard key={w.id} wall={w} collections={lib.collections} actions={actions} />)}</ul>}

      {empty && (
        <div className="empty"><div className="in">
          <EmptyArt />
          {q.trim() ? <><h2>Nothing matches “{q.trim()}”</h2><p>Try a different word.</p><div className="acts"><button className="btn" type="button" onClick={() => setQ('')}>Clear search</button></div></>
            : collection === 'fav' ? <><h2>No favourites yet</h2><p>Tap the heart on any wall to pin it here.</p></>
            : activeCol ? <><h2>This collection is empty</h2><p>Add walls from the ⋯ menu on any card.</p></>
            : <><h2>No walls saved yet</h2><p>Make a wall you like, then tap Save. Saved walls live on this device, and sync if you sign in.</p>
              <div className="acts"><Link className="btn primary lg" href="/">Make a wall</Link><Link className="lnk" href="/" onClick={() => s.randomize()}>Try a random seed</Link></div></>}
        </div></div>
      )}
    </main>
  )
}
