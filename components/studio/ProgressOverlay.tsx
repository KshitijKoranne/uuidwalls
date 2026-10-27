export default function ProgressOverlay({ progress }: { progress: number }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 201, background: 'rgba(10,9,8,0.82)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--p85)', letterSpacing: '0.1em', textAlign: 'center', lineHeight: 1.6 }}>Building your wall…<br /><span style={{ fontSize: '9px', opacity: 0.5 }}>This may take a moment</span></div>
      <div style={{ width: 240, height: 2, background: 'var(--p15)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'var(--paper)', borderRadius: 2, width: `${progress * 100}%`, transition: 'width 0.12s linear' }} />
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--p30)', letterSpacing: '0.08em' }}>{(progress * 100).toFixed(0)}%</div>
    </div>
  )
}
