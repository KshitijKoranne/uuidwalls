export default function Toast({ text, visible }: { text: string; visible: boolean }) {
  return <div id="toast" className={`toast${visible ? ' show' : ''}`} role="status" aria-live="polite">{text}</div>
}
