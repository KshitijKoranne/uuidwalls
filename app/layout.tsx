import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UUIDWalls — Turn Your Device UUID Into a Unique Generative Wallpaper',
  description: 'UUIDWalls converts your device UUID into a one-of-a-kind generative wallpaper. Deterministic, private, and works on Mac, Windows, Linux, iPhone, and Android.',
  metadataBase: new URL('https://uuidwalls.vercel.app'),
  openGraph: {
    title: 'UUIDWalls — Your Device Has a Face',
    description: 'Every device carries a UUID shared with no machine on earth. We render it into a generative wallpaper that is yours permanently.',
    images: ['/og-image.jpg'],
    type: 'website',
    url: 'https://uuidwalls.vercel.app',
    siteName: 'UUIDWalls',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UUIDWalls — Your Device Has a Face',
    description: 'Turn your device UUID into a unique generative wallpaper. Deterministic. Private. Yours forever.',
    images: ['/og-image.jpg'],
    site: '@kjrlabs',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,700&family=IBM+Plex+Mono:wght@400;500&family=Outfit:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body>{children}</body>
    </html>
  )
}
