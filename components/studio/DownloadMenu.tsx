'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { PRICE, isPaidSize, type DlSizeKey } from '@/lib/payments/catalog'
import { useStudio } from './context'

const ghostBtn = { display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--p15)', borderRadius: 'var(--r6)', padding: '7px 13px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p55)', cursor: 'pointer' } as const

/**
 * Disclosure pattern: the trigger toggles a list of real buttons. Keyboard: Tab/Enter/Space work,
 * Esc closes and returns focus to the trigger, a click or focus outside closes.
 */
export default function DownloadMenu() {
  const s = useStudio()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (e: Event) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); trigger.current?.focus() } }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('focusin', onPointer)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('focusin', onPointer); document.removeEventListener('keydown', onKey) }
  }, [open])

  const options: Array<{ key: DlSizeKey; label: string; dim: string }> = [
    { key: 'screen', label: 'Screen resolution', dim: s.dimScreen },
    { key: 'mobile', label: 'Mobile', dim: '1290×2796' },
    { key: '2k', label: `2K ${!s.isPaid ? `— unlock ${PRICE.display}` : ''}`, dim: '2560×1440' },
    { key: '4k', label: `4K ${!s.isPaid ? `— unlock ${PRICE.display}` : ''}`, dim: '3840×2160' },
  ]

  return (
    <div ref={root} style={{ position: 'relative' }}>
      <button ref={trigger} onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls={open ? panelId : undefined} style={ghostBtn}>↓ Download</button>
      {open && (
        <div id={panelId} role="group" aria-label="Download size" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, background: 'var(--ink2)', border: '1px solid var(--p15)', borderRadius: 'var(--r10)', padding: 6, minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 50 }}>
          {options.map(opt => (
            <button key={opt.key} type="button" onClick={() => { setOpen(false); s.download(opt.key) }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '9px 12px', borderRadius: 'var(--r6)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '10px', color: isPaidSize(opt.key) && !s.isPaid ? 'var(--p30)' : 'var(--p85)', gap: 16, whiteSpace: 'nowrap' }}>
              <span style={{ letterSpacing: '0.04em' }}>{opt.label}</span>
              <span style={{ color: 'var(--p30)', fontSize: 9 }}>{opt.dim}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
