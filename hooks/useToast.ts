'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface ToastState {
  text: string
  /** Action buttons (Undo, View, Cancel, ...). */
  actions?: Array<{ label: string; run: () => void }>
  /** 0..1 shows a progress bar (downloads). */
  progress?: number | null
  error?: boolean
  visible: boolean
}

export interface ToastOptions { ms?: number; actions?: ToastState['actions']; progress?: number | null; error?: boolean; sticky?: boolean }

const HIDDEN: ToastState = { text: '', visible: false }

/** One toast at a time (SPEC 7.7): auto-dismiss after 4 s (6 s with an action), paused while hovered or focused. */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(HIDDEN)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ms = useRef(0)
  const paused = useRef(false)

  const arm = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    if (ms.current > 0 && !paused.current) timer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), ms.current)
  }, [])

  const show = useCallback((text: string, opts: ToastOptions = {}) => {
    ms.current = opts.sticky ? 0 : (opts.ms ?? (opts.actions?.length ? 6000 : 4000))
    setToast({ text, actions: opts.actions, progress: opts.progress, error: opts.error, visible: true })
    arm()
  }, [arm])

  /** Change progress/text of the toast that is showing (a running download). */
  const update = useCallback((patch: Partial<ToastState>) => setToast(t => (t.visible ? { ...t, ...patch } : t)), [])
  const hide = useCallback(() => { if (timer.current) clearTimeout(timer.current); setToast(t => ({ ...t, visible: false })) }, [])
  const pause = useCallback((p: boolean) => { paused.current = p; if (p) { if (timer.current) clearTimeout(timer.current) } else arm() }, [arm])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  return { toast, show, update, hide, pause }
}
