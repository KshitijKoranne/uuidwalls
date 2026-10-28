import type { ToastState } from '@/hooks/useToast'

/**
 * The toast (SPEC 7.7). The page renders one, and every open modal dialog renders its own copy INSIDE itself:
 * a modal <dialog> makes everything outside it inert (and covers it), so a toast outside could not be clicked
 * (an Undo, a Cancel). While a modal is open the page's copy is hidden, so there is only ever one live region.
 */
export default function Toast({ toast, onHover, onDismiss, hidden = false, id }: { toast: ToastState; onHover: (over: boolean) => void; onDismiss: () => void; hidden?: boolean; id?: string }) {
  return (
    <div
      id={id}
      className={`toast${toast.visible ? ' show' : ''}`}
      style={hidden ? { visibility: 'hidden' } : undefined}
      aria-hidden={hidden || undefined}
      role={toast.error ? 'alert' : 'status'}
      aria-live={toast.error ? 'assertive' : 'polite'}
      onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)} onBlur={() => onHover(false)}
    >
      {toast.error && <svg className="icon-s" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18, color: 'var(--danger)' }}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>}
      <span>{toast.text}</span>
      {typeof toast.progress === 'number' && (
        <span role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(toast.progress * 100)} aria-label="Progress" style={{ width: 96, height: 4, borderRadius: 4, background: 'rgba(243,240,235,.14)', overflow: 'hidden' }}>
          <i style={{ display: 'block', height: '100%', width: `${Math.round(toast.progress * 100)}%`, background: 'var(--wall-accent)' }} />
        </span>
      )}
      {toast.actions?.map(a => <button key={a.label} type="button" onClick={() => { a.run(); onDismiss() }}>{a.label}</button>)}
    </div>
  )
}
