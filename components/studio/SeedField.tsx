'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { checkSeed, type SeedCheck } from '@/lib/wall/seed'
import { IconAlert, IconCheck, IconCopy, IconDice } from './icons'
import { useStudio } from './context'

type Helper = { tone: '' | 'ok' | 'err'; icon: 'check' | 'alert' | null; text: string }

function helperFor(c: SeedCheck | null, typing: boolean, kind: string, pasteBlocked: boolean): Helper {
  if (pasteBlocked) return { tone: 'err', icon: 'alert', text: 'Paste blocked. Long-press the field and choose Paste.' }
  if (typing) return { tone: '', icon: null, text: 'Reading…' }
  if (c) {
    switch (c.status) {
      case 'normalized': return { tone: 'ok', icon: 'check', text: 'We cleaned up your input (case, braces, spaces).' }
      case 'valid': return { tone: 'ok', icon: 'check', text: 'Valid UUID. It stays in this browser.' }
      case 'short': return { tone: 'err', icon: 'alert', text: `That’s too short. A UUID has 32 hex characters (0-9, a-f); an Android ID has 16. You typed ${c.found}.` }
      case 'long': return { tone: 'err', icon: 'alert', text: `That’s too long. A UUID has 32 hex characters (0-9, a-f). You typed ${c.found}.` }
      case 'badchars': return { tone: 'err', icon: 'alert', text: `Only 0-9 and a-f are allowed. We found: ${c.bad.join(', ')}.` }
      case 'empty': return { tone: '', icon: null, text: 'No UUID yet? Try Random, or tap Find my UUID.' }
    }
  }
  if (kind === 'sample') return { tone: '', icon: null, text: 'Sample seed. Paste your own UUID, or try Random.' }
  if (kind === 'random') return { tone: '', icon: null, text: 'Random seed. Save it to keep it.' }
  if (kind === 'hidden') return { tone: '', icon: null, text: 'Seed hidden: this wall came from a link, so there’s no UUID to show. Paste one or try Random.' }
  return { tone: 'ok', icon: 'check', text: 'Valid UUID. It stays in this browser.' }
}

export default function SeedField({ onInvalid }: { onInvalid: (invalid: boolean) => void }) {
  const s = useStudio()
  const id = useId()
  const [text, setText] = useState(s.uuid)
  const [check, setCheck] = useState<SeedCheck | null>(null)
  const [typing, setTyping] = useState(false)
  const [pasteBlocked, setPasteBlocked] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastUuid = useRef(s.uuid)

  useEffect(() => { // the wall changed from outside (Random, Explore, a link): show its seed
    if (s.uuid === lastUuid.current) return
    lastUuid.current = s.uuid
    const t = setTimeout(() => { setText(s.uuid); setCheck(null); setTyping(false); onInvalid(false) }, 0)
    return () => clearTimeout(t)
  }, [s.uuid, onInvalid])

  function onChange(value: string) {
    setText(value); setPasteBlocked(false); setTyping(true)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      const c = checkSeed(value)
      setTyping(false); setCheck(c)
      const ok = c.status === 'valid' || c.status === 'normalized'
      onInvalid(c.status !== 'empty' && !ok)
      if (ok) { lastUuid.current = c.value; if (c.status === 'normalized') setText(c.value); s.setSeed(c.value) }
    }, 300)
  }

  async function paste() {
    try { onChange(await navigator.clipboard.readText()) } catch { setPasteBlocked(true) }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(s.uuid); s.showToast('Seed copied.') } catch { s.showToast('Couldn’t copy. Select the seed and copy it.', { error: true }) }
  }

  const hidden = s.sharedWall && !text
  const h = helperFor(check, typing, s.seedKind, pasteBlocked)
  const kindLabel = s.seedKind === 'sample' ? 'Sample seed' : s.seedKind === 'random' ? 'Random seed' : s.seedKind === 'hidden' ? 'Hidden' : 'Your seed'

  return (
    <div>
      <h3><span className="label" id={`${id}-l`}>Seed</span><em>{kindLabel}</em></h3>
      <div className="seedrow">
        <input id={id} className="field mono" type="text" inputMode="text" autoComplete="off" autoCapitalize="off" spellCheck={false}
          aria-labelledby={`${id}-l`} aria-describedby={`${id}-h`} aria-invalid={h.tone === 'err'}
          placeholder={hidden ? 'Seed hidden (saved from a link)' : 'Paste your device UUID'} value={text} onChange={e => onChange(e.target.value)} />
        <button className="btn icon" type="button" onClick={copy} disabled={hidden || !s.uuid} aria-label="Copy seed" title="Copy seed"><IconCopy /></button>
      </div>
      <div id={`${id}-h`} className={`helper ${h.tone}`} aria-live="polite">
        {h.icon === 'check' && <IconCheck />}{h.icon === 'alert' && <IconAlert />}<span>{h.text}</span>
      </div>
      <div className="quick">
        <button className="btn" type="button" onClick={paste}>Paste</button>
        <button className="btn" type="button" onClick={s.randomize} title="Random seed (Space)"><IconDice />Random seed</button>
        <button className="btn ghost" type="button" onClick={() => s.openDialog({ kind: 'find' })}>Find my UUID</button>
      </div>
    </div>
  )
}
