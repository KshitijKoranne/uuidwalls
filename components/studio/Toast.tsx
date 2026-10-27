export default function Toast({ text, visible }: { text: string; visible: boolean }) {
  return (
    <div id="toast" role="status" aria-live="polite" style={{
      position: 'fixed', bottom: '2rem', left: '50%',
      transform: `translateX(-50%) translateY(${visible ? '0' : '80px'})`,
      background: 'var(--paper)', color: 'var(--ink)', borderRadius: 'var(--r6)',
      padding: '11px 20px', fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 500,
      letterSpacing: '0.04em', zIndex: 999, transition: 'transform 0.35s cubic-bezier(.34,1.56,.64,1)',
      whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>{text}</div>
  )
}
