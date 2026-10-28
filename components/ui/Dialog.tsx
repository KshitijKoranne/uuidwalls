'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Modal dialog on the native <dialog> element: focus is trapped and the page behind is inert,
 * Esc closes, focus returns to what opened it, and role/aria-modal come for free (WCAG 2.4.3, 4.1.2).
 * Under 900px it is a bottom sheet (CSS). Mount it to open it; unmount (or onClose) to close.
 */
export default function Dialog({ onClose, labelledBy, children }: { onClose: () => void; labelledBy: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (!d.open) d.showModal()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev; if (d.open) d.close() }
  }, [])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={e => {
        // A click on the backdrop lands on the <dialog> itself, outside its box.
        const r = e.currentTarget.getBoundingClientRect()
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose()
      }}
    >
      <button className="btn ghost icon x" type="button" onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
      {children}
    </dialog>
  )
}
