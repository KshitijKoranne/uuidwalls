'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useToast() {
  const [toast, setToast] = useState('')
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const show = useCallback((msg: string, ms = 2400) => {
    if (timer.current) clearTimeout(timer.current)
    setToast(msg); setVisible(true)
    timer.current = setTimeout(() => setVisible(false), ms)
  }, [])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  return { toast, visible, show }
}
