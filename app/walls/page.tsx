import type { Metadata } from 'next'
import WallsView from '@/components/walls/WallsView'

export const metadata: Metadata = {
  title: 'My walls — UUID Walls',
  description: 'The walls you saved. They live on this device, and sync if you sign in.',
  robots: { index: false, follow: true }, // personal page
  alternates: { canonical: '/walls' },
}

export default function WallsPage() {
  return <WallsView />
}
