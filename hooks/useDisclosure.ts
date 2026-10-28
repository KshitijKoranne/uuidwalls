'use client'

import { useEffect, useRef, useState } from 'react'

/** Open/close state for a disclosure: Esc and a click or focus outside close it, Esc returns focus to the trigger. */
export function useDisclosure() {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const outside = (e: Event) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); trigger.current?.focus() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', outside); document.removeEventListener('keydown', key) }
  }, [open])
  return { open, setOpen, root, trigger }
}
