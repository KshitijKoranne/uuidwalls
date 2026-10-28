'use client'

import { FAMS, FAM_LABEL } from '@/lib/wall'
import { useStudio } from './context'
import DownloadMenu from './DownloadMenu'
import ShareMenu from './ShareMenu'
import WallCanvas from './WallCanvas'

const ghostBtn = { display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-sm)', padding: '7px 13px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--faint)', cursor: 'pointer' } as const

export default function Hero() {
  const s = useStudio()
  return (
    <section id="hero" style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 58 }}>
      <WallCanvas />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 70% at 50% 50%,rgba(10,9,8,0.05) 0%,rgba(10,9,8,0.6) 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, pointerEvents: 'none', background: 'linear-gradient(transparent,var(--base))' }} />

      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '2rem 1.5rem', maxWidth: 760, width: '100%' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: '1.75rem', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--faint)' }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--faint)', display: 'inline-block' }} />
          Generative · Deterministic · Private
        </div>

        <h1 style={{ fontFamily: 'var(--font)', fontSize: 'clamp(3rem,8vw,6rem)', fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.025em', color: 'var(--ink)', marginBottom: '1.2rem', textShadow: '0 2px 48px rgba(10,9,8,0.85)' }}>
          Your device<br /><em style={{ fontStyle: 'italic', fontWeight: 400 }}>has a face.</em>
        </h1>

        <p style={{ fontSize: 'clamp(0.95rem,2vw,1.1rem)', fontWeight: 300, color: 'var(--soft)', lineHeight: 1.75, margin: '0 auto 2.25rem', maxWidth: 460, textShadow: '0 1px 16px rgba(10,9,8,0.9)' }}>
          Every device carries a UUID shared with no machine on earth. Enter yours — we render it into a wallpaper that belongs to no one else.
        </p>

        {/* GENERATOR CARD */}
        <div style={{ background: 'rgba(10,9,8,0.72)', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-lg)', padding: '1.375rem 1.625rem 1.125rem', backdropFilter: 'blur(28px)', maxWidth: 620, margin: '0 auto', boxShadow: '0 8px 48px rgba(0,0,0,0.55)' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', overflowX: 'auto', paddingBottom: 2 }}>
            {FAMS.map(f => (
              <button key={f} onClick={() => s.selectFamily(f)} aria-pressed={s.family === f} style={{
                background: s.family === f ? 'var(--ink)' : 'var(--surface-2)',
                border: `1px solid ${s.family === f ? 'var(--ink)' : 'var(--line-strong)'}`,
                borderRadius: 20, padding: '6px 14px', fontFamily: 'var(--mono)', fontSize: '10px',
                letterSpacing: '0.08em', color: s.family === f ? 'var(--base)' : 'var(--faint)',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: s.family === f ? 500 : 400,
                transition: 'all var(--t-base) var(--ease)',
              }}>
                {FAM_LABEL[f]}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', marginBottom: '0.875rem' }}>
            <input
              value={s.uuid}
              onChange={e => s.onUuidInput(e.target.value)}
              placeholder={s.sharedWall ? 'Shared wall · enter your own UUID…' : 'Enter your device UUID…'}
              aria-label="Device UUID"
              spellCheck={false}
              autoComplete="off"
              style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-sm)', padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--ink)', outline: 'none', minWidth: 0, letterSpacing: '0.04em' }}
            />
            <button onClick={s.randomize} style={{ background: 'transparent', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-sm)', padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--faint)', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
              ↻ Random
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: '0.875rem', borderTop: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--faint)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s ease-in-out infinite', display: 'inline-block' }} />
              {s.metaText}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={s.getMyUUID} style={{ ...ghostBtn, letterSpacing: '0.05em' }}>Get my UUID</button>
              <button onClick={s.toggleWatermark} aria-pressed={s.wmEnabled} style={ghostBtn}>Watermark: {s.wmEnabled ? 'On' : 'Off'}</button>

              <ShareMenu />
              <DownloadMenu />
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '2.25rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, color: 'var(--faint)', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        <svg width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden="true"><path d="M6 0v12M1 8l5 6 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Scroll
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
    </section>
  )
}
