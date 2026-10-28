'use client'

import { useEffect, useId, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import { useStudio } from '@/components/studio/context'

type Os = 'mac' | 'windows' | 'linux' | 'iphone' | 'android'
const OS: Array<{ id: Os; label: string; cmd?: string; text: string }> = [
  { id: 'mac', label: 'Mac', cmd: "system_profiler SPHardwareDataType | grep 'Hardware UUID'", text: 'Open Terminal, paste this, press Return. The Hardware UUID is the one you want.' },
  { id: 'windows', label: 'Windows', cmd: 'Get-CimInstance Win32_ComputerSystemProduct | Select-Object -ExpandProperty UUID', text: 'Open PowerShell, paste this, press Enter. (Older Windows: wmic csproduct get UUID in Command Prompt.)' },
  { id: 'linux', label: 'Linux', cmd: 'cat /etc/machine-id', text: 'Open a terminal, paste this, press Enter.' },
  { id: 'iphone', label: 'iPhone', text: 'Settings → General → About. Newer iOS versions may not show a UUID. If you can’t find one, a random seed works the same.' },
  { id: 'android', label: 'Android', text: 'Settings → About phone → Status → look for an ID. Many phones don’t show one. If you can’t find it, a random seed works the same.' },
]

function detect(): Os {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iphone'
  if (ua.includes('android')) return 'android'
  if (ua.includes('mac')) return 'mac'
  if (ua.includes('win')) return 'windows'
  return 'linux'
}

export default function FindDialog() {
  const s = useStudio()
  const id = useId()
  const [os, setOs] = useState<Os>('mac')
  useEffect(() => { const t = setTimeout(() => setOs(detect()), 0); return () => clearTimeout(t) }, [])
  const cur = OS.find(o => o.id === os)!

  async function copy() {
    if (!cur.cmd) return
    try { await navigator.clipboard.writeText(cur.cmd); s.showToast('Command copied. Paste it in your terminal.') } catch { s.showToast('Couldn’t copy. Select the command and copy it.', { error: true }) }
  }

  return (
    <Dialog onClose={s.closeDialog} labelledBy={id}>
      <h2 id={id}>Find my UUID</h2>
      <div className="tabs" role="radiogroup" aria-label="Your device">
        {OS.map(o => (
          <button key={o.id} type="button" role="radio" aria-checked={o.id === os} className="chip" onClick={() => setOs(o.id)}>{o.label}</button>
        ))}
      </div>
      <p>{cur.text}</p>
      {cur.cmd && (
        <div className="cmd"><code>{cur.cmd}</code><button className="btn sm" type="button" onClick={copy}>Copy</button></div>
      )}
      <div className="row">
        <button className="btn primary lg" type="button" onClick={() => { s.closeDialog(); s.randomize() }}>Use a random seed</button>
        <button className="btn lg" type="button" onClick={s.closeDialog}>Done</button>
      </div>
    </Dialog>
  )
}
