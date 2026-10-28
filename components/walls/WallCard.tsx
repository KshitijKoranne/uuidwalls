'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useDisclosure } from '@/hooks/useDisclosure'
import type { Collection, SavedWall } from '@/lib/library/types'
import { FAM_LABEL } from '@/lib/wall'
import { isAbort, wallRenderer } from '@/lib/wall/client'
import { wallName } from '@/lib/wall/name'
import { decodeWall } from '@/lib/wall/token'
import { IconHeart, IconMore } from '@/components/studio/icons'

export interface CardActions {
  open(w: SavedWall): void
  favorite(w: SavedWall): void
  rename(w: SavedWall, label: string | null): void
  move(w: SavedWall, collectionId: string | null): void
  copyLink(w: SavedWall): void
  remove(w: SavedWall): void
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

export default function WallCard({ wall, collections, actions }: { wall: SavedWall; collections: Collection[]; actions: CardActions }) {
  const P = decodeWall(wall.token)
  const name = wall.label ?? (P ? wallName(P) : 'Wall')
  const canvas = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)
  const [tries, setTries] = useState(0)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const { open, setOpen, root, trigger } = useDisclosure()
  const menuId = useId()

  useEffect(() => {
    const c = canvas.current; if (!c || !P) return
    const ctl = new AbortController()
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return
      io.disconnect()
      setFailed(false)
      wallRenderer.draw(c, { P, w: 480, h: 300, hq: false }, { lane: 'thumb', signal: ctl.signal }).catch(e => { if (!isAbort(e)) setFailed(true) })
    }, { rootMargin: '300px' })
    io.observe(c)
    return () => { io.disconnect(); ctl.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the wall's look is fixed by its token
  }, [wall.token, tries])

  function commit() { setEditing(false); actions.rename(wall, draft.trim() === '' || draft.trim() === wallName(P!) ? null : draft) }
  const run = (fn: () => void) => () => { setOpen(false); fn() }

  return (
    <li className={`card${failed ? ' fail' : ''}`} style={{ listStyle: 'none' }}>
      {failed
        ? <div className="thumb" role="group" aria-label="Couldn’t draw this one">Couldn’t draw this one<div style={{ display: 'flex', gap: 8, marginTop: 8 }}><button className="btn sm" type="button" onClick={() => setTries(n => n + 1)}>Retry</button><button className="btn sm" type="button" onClick={() => actions.remove(wall)}>Remove</button></div></div>
        : <button type="button" className="thumb" onClick={() => actions.open(wall)} aria-label={`Open ${name} in the studio`}><canvas ref={canvas} aria-hidden="true" /></button>}
      <button className="fav hov" type="button" aria-pressed={wall.isFavorite} aria-label={wall.isFavorite ? `Remove ${name} from favourites` : `Add ${name} to favourites`} onClick={() => actions.favorite(wall)}><IconHeart /></button>
      <div className="meta">
        <div className="t">
          {editing
            ? <input autoFocus value={draft} maxLength={80} aria-label="Wall name" onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }} />
            : <button className="nm" type="button" onClick={() => { setDraft(name); setEditing(true) }} aria-label={`Rename ${name}`} title="Rename">{name}</button>}
          <span className="cap caption">{FAM_LABEL[wall.family]} · {fmt(wall.createdAt)}</span>
        </div>
        <div className="more" ref={root}>
          <button ref={trigger} className="btn ghost icon hov" type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} aria-label={`More for ${name}`} onClick={() => setOpen(o => !o)}><IconMore /></button>
          {open && (
            <div id={menuId} className="pop" role="menu" aria-label={`Actions for ${name}`}>
              <button role="menuitem" type="button" onClick={run(() => actions.open(wall))}>Open in studio</button>
              <button role="menuitem" type="button" onClick={run(() => { setDraft(name); setEditing(true) })}>Rename</button>
              <button role="menuitem" type="button" onClick={run(() => actions.favorite(wall))}>{wall.isFavorite ? 'Unfavourite' : 'Favourite'}</button>
              <button role="menuitem" type="button" onClick={run(() => actions.copyLink(wall))}>Copy share link</button>
              {collections.length > 0 && <><hr /><div className="lbl" aria-hidden="true">Add to collection</div>
                {collections.map(c => <button key={c.id} role="menuitem" type="button" onClick={run(() => actions.move(wall, c.id))}>{wall.collectionId === c.id ? '✓ ' : ''}{c.name}</button>)}
                {wall.collectionId && <button role="menuitem" type="button" onClick={run(() => actions.move(wall, null))}>Remove from collection</button>}</>}
              <hr />
              <button role="menuitem" type="button" className="danger" onClick={run(() => actions.remove(wall))}>Delete</button>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
