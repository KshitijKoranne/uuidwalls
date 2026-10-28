import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>Made by KJR Labs</div>
      <nav aria-label="Footer">
        <a href="mailto:kjrlabs9@gmail.com">Contact</a>
        <a href="https://kjrlabs.in" target="_blank" rel="noopener noreferrer">KJR Labs</a>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/refund">Refund</Link>
      </nav>
    </footer>
  )
}
