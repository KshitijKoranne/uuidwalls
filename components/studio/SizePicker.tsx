'use client'

import { useEffect, useId, useRef } from 'react'
import { useDisclosure } from '@/hooks/useDisclosure'
import { SIZE_LABEL } from '@/lib/download'
import { PRICE, isPaidSize, type DlSizeKey } from '@/lib/payments/catalog'
import { IconChevron, IconLock } from './icons'
import { useStudio } from './context'

const DIMS: Record<Exclude<DlSizeKey, 'screen'>, string> = { mobile: '1290×2796', '2k': '2560×1440', '4k': '3840×2160' }
const KEYS: DlSizeKey[] = ['screen', 'mobile', '2k', '4k']

/** Size picker + menu (SPEC 7.6). Picking selects; a locked size opens the unlock sheet instead. */
export default function SizePicker() {
  const s = useStudio()
  const { open, setOpen, root, trigger } = useDisclosure()
  const menuId = useId()
  const items = useRef<Array<HTMLButtonElement | null>>([])
  const dim = (k: DlSizeKey) => (k === 'screen' ? s.dimScreen : DIMS[k])

  useEffect(() => { if (open) items.current[Math.max(0, KEYS.indexOf(s.size))]?.focus() }, [open, s.size])

  function onKey(e: React.KeyboardEvent) {
    const els = items.current.filter(Boolean) as HTMLButtonElement[]
    const i = els.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); els[(i + 1) % els.length]?.focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); els[(i - 1 + els.length) % els.length]?.focus() }
    else if (e.key === 'Home') { e.preventDefault(); els[0]?.focus() }
    else if (e.key === 'End') { e.preventDefault(); els[els.length - 1]?.focus() }
    else if (e.key === 'Tab') setOpen(false)
    else if (e.key.length === 1 && /\S/.test(e.key)) { const m = els.find(b => b.textContent?.trim().toLowerCase().startsWith(e.key.toLowerCase())); m?.focus() } // type-ahead
  }

  const pick = (k: DlSizeKey) => { setOpen(false); trigger.current?.focus(); s.chooseSize(k) }

  return (
    <div ref={root} style={{ display: 'contents' }}>
      <button ref={trigger} className="btn chev" type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen(o => !o)}>
        <span><b style={{ fontWeight: 500, fontSize: 14 }}>{SIZE_LABEL[s.size]}</b><small>{dim(s.size)}</small></span>
        <IconChevron />
      </button>
      {open && (
        <div id={menuId} className="menu" role="menu" aria-label="Download size" onKeyDown={onKey}>
          {KEYS.map((k, i) => {
            const locked = isPaidSize(k) && !s.isPaid
            return (
              <button key={k} ref={el => { items.current[i] = el }} type="button" role="menuitemradio" aria-checked={s.size === k} onClick={() => pick(k)}>
                <span>{SIZE_LABEL[k]} <span className="size">{dim(k)}</span></span>
                {locked && <span className="tag"><span style={{ width: 14, height: 14, display: 'inline-flex' }}><IconLock /></span>{PRICE.display} once</span>}
              </button>
            )
          })}
          <hr />
          <div className="switch-row">
            <span id={`${menuId}-wm`}>Add small signature</span>
            <button className="switch" type="button" role="switch" aria-checked={s.wmEnabled} aria-labelledby={`${menuId}-wm`} onClick={s.toggleWatermark} />
          </div>
        </div>
      )}
    </div>
  )
}
