'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import { PRICE } from '@/lib/payments/catalog'
import { useStudio } from './context'
import { IconMenu } from './icons'

export default function TopBar() {
  const s = useStudio()
  const pathname = usePathname()
  const home = pathname === '/' || pathname.startsWith('/w/')
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const accountsReady = s.authChecked && s.accountsEnabled
  const count = s.library.lib.walls.length
  const signIn = () => { setMenu(false); s.openDialog({ kind: 'signin', trigger: 'nav' }) }
  const unlock = () => { setMenu(false); s.openDialog({ kind: 'unlock', size: '4k', step: 'intro' }) }
  const walls = (
    <>My walls <span className="count" aria-label={`${count} saved`}>{count}</span></>
  )

  return (
    <>
      <header className={`bar${scrolled || !home ? ' solid' : ''}`}>
        <Link className="brand" href="/" aria-label="UUID Walls home"><i className="mark" aria-hidden="true" /><span>UUID Walls</span></Link>
        <Link className="pill plain nav-text" href="/#explore">Explore</Link>
        <Link className={`pill plain nav-text${pathname === '/walls' ? ' here' : ''}`} href="/walls" aria-current={pathname === '/walls' ? 'page' : undefined}>{walls}</Link>
        {accountsReady && (s.user
          ? <button className="pill plain nav-text" type="button" onClick={s.signOut}>Sign out</button>
          : <button className="pill plain nav-text" type="button" onClick={signIn}>Sign in</button>)}
        {accountsReady && (s.isPaid
          ? <span className="pill quiet hide-sm" title="2K and 4K are unlocked for your account">2K · 4K</span>
          : <button className="pill accent hide-sm" type="button" onClick={unlock}>Unlock 2K &amp; 4K</button>)}
        <button className="pill menu-btn" type="button" aria-label="Menu" aria-haspopup="dialog" onClick={() => setMenu(true)}><span style={{ width: 20, height: 20, display: 'inline-flex' }}><IconMenu /></span></button>
      </header>

      {menu && (
        <Dialog onClose={() => setMenu(false)} labelledBy="menu-title">
          <h2 id="menu-title">Menu</h2>
          <nav aria-label="Main" style={{ display: 'grid', gap: 8 }}>
            <Link className="btn lg" href="/#explore" onClick={() => setMenu(false)}>Explore</Link>
            <Link className="btn lg" href="/walls" onClick={() => setMenu(false)}>{walls}</Link>
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
