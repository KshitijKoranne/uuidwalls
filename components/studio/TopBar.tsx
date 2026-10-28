'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import { PRICE } from '@/lib/payments/catalog'
import { useStudio } from './context'

export default function TopBar() {
  const s = useStudio()
  const [solid, setSolid] = useState(false)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 8)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const accountsReady = s.authChecked && s.accountsEnabled
  const signIn = () => { setMenu(false); s.openAuth('unlock') }
  const unlock = () => { setMenu(false); s.unlock() }

  return (
    <>
      <header className={`bar${solid ? ' solid' : ''}`}>
        <Link className="brand" href="/" aria-label="UUID Walls home"><i className="mark" aria-hidden="true" /><span>UUID Walls</span></Link>
        <Link className="pill plain nav-text" href="/#explore">Explore</Link>
        {accountsReady && (s.user
          ? <button className="pill plain nav-text" type="button" onClick={s.signOut}>Sign out</button>
          : <button className="pill plain nav-text" type="button" onClick={signIn}>Sign in</button>)}
        {accountsReady && (s.isPaid
          ? <span className="pill quiet hide-sm" title="2K and 4K are unlocked for your account">2K · 4K</span>
          : <button className="pill accent hide-sm" type="button" onClick={unlock}>Unlock 2K &amp; 4K</button>)}
        <button className="pill menu-btn" type="button" aria-label="Menu" aria-haspopup="dialog" onClick={() => setMenu(true)}>
          <svg className="icon-s" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </header>

      {menu && (
        <Dialog onClose={() => setMenu(false)} labelledBy="menu-title">
          <h2 id="menu-title">Menu</h2>
          <nav aria-label="Main" style={{ display: 'grid', gap: 8 }}>
            <Link className="btn lg" href="/#explore" onClick={() => setMenu(false)}>Explore</Link>
            {accountsReady && (s.user
              ? <button className="btn lg" type="button" onClick={s.signOut}>Sign out</button>
              : <button className="btn lg" type="button" onClick={signIn}>Sign in</button>)}
            {accountsReady && !s.isPaid && <button className="btn accent lg" type="button" onClick={unlock}>Unlock 2K &amp; 4K · {PRICE.display}</button>}
          </nav>
        </Dialog>
      )}
    </>
  )
}
