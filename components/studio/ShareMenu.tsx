'use client'

import { useId } from 'react'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useStudio } from './context'

const ghostBtn = { display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--p15)', borderRadius: 'var(--r6)', padding: '7px 13px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p55)', cursor: 'pointer' } as const
const item = { display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '9px 12px', borderRadius: 'var(--r6)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p85)', letterSpacing: '0.04em', whiteSpace: 'nowrap' } as const

/**
 * Share. The default link carries the wall's look, not the device UUID. Sharing the raw UUID is a
 * separate, explicit choice (and not offered when the wall itself came from a private link).
 */
export default function ShareMenu() {
  const s = useStudio()
  const { open, setOpen, root, trigger } = useDisclosure()
  const panelId = useId()
  const act = (fn: () => void | Promise<void>) => () => { setOpen(false); void fn() }
  return (
    <div ref={root} style={{ position: 'relative' }}>
      <button ref={trigger} onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls={open ? panelId : undefined} style={ghostBtn}>Share</button>
      {open && (
        <div id={panelId} role="group" aria-label="Share this wall" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, background: 'var(--ink2)', border: '1px solid var(--p15)', borderRadius: 'var(--r10)', padding: 6, minWidth: 250, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 50 }}>
          <button type="button" style={item} onClick={act(() => s.copyShareLink('private'))}>Copy link · hides your UUID</button>
          <button type="button" style={item} onClick={act(s.shareOnX)}>Share on X · hides your UUID</button>
          {!s.sharedWall && (
            <button type="button" style={{ ...item, color: 'var(--p55)' }} onClick={act(() => s.copyShareLink('raw'))}>Copy link with my UUID</button>
          )}
        </div>
      )}
    </div>
  )
}
