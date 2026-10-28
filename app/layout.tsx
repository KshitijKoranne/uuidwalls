import type { Metadata, Viewport } from 'next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import Footer from '@/components/Footer'
import StudioProvider from '@/components/studio/StudioProvider'
import TopBar from '@/components/studio/TopBar'
import { siteUrl } from '@/lib/site'

export const viewport: Viewport = { themeColor: '#0b0a09', colorScheme: 'dark' }

export const metadata: Metadata = {
  applicationName: 'UUID Walls',
  title: 'UUIDWalls — Turn Your Device UUID Into a Unique Generative Wallpaper',
  description: 'UUIDWalls converts your device UUID into a one-of-a-kind generative wallpaper. Deterministic, private, and works on Mac, Windows, Linux, iPhone, and Android.',
  metadataBase: new URL(siteUrl()),
  openGraph: {
    title: 'UUIDWalls — Your Device Has a Face',
    description: 'Every device carries a UUID shared with no machine on earth. We render it into a generative wallpaper that is yours permanently.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'A generative wallpaper made from a device UUID' }],
    type: 'website',
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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <StudioProvider>
          <TopBar />
          {children}
          <Footer />
        </StudioProvider>
      </body>
    </html>
  )
}
