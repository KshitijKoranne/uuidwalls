'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import Toast from '@/components/studio/Toast'
import { useStudio } from '@/components/studio/context'

/**
 * Modal dialog on the native <dialog> element: focus is trapped and the page behind is inert,
 * Esc closes, focus returns to what opened it, and role/aria-modal come for free (WCAG 2.4.3, 4.1.2).
 * Under 900px it is a bottom sheet (CSS). Mount it to open it; unmount (or onClose) to close.
 * `locked` (while a payment is in flight) ignores Esc, the backdrop and the close button.
 */
export default function Dialog({ onClose, labelledBy, children, locked = false }: { onClose: () => void; labelledBy: string; children: ReactNode; locked?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { toastView, modalOpened } = useStudio()

  useEffect(() => { modalOpened(1); return () => modalOpened(-1) }, [modalOpened])

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
      onCancel={e => { if (locked) e.preventDefault() }}
      onClick={e => {
        if (locked) return
        // A click on the backdrop lands on the <dialog> itself, outside its box.
        const r = e.currentTarget.getBoundingClientRect()
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose()
      }}
    >
      <button className="btn ghost icon x" type="button" onClick={onClose} aria-label="Close" disabled={locked}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
      {children}
      <Toast toast={toastView.toast} onHover={toastView.hover} onDismiss={toastView.dismiss} />
    </dialog>
  )
}
