import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import HomeContent from '@/components/HomeContent'
import { FAM_LABEL } from '@/lib/wall/constants'
import { decodeWall } from '@/lib/wall/token'

type Props = { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const P = decodeWall(token)
  if (!P) return { title: 'Wall not found — UUIDWalls', robots: { index: false } }
  const title = `${FAM_LABEL[P.family]} wall — UUIDWalls`
  const description = 'A one-of-a-kind generative wallpaper made from a device UUID. Make yours in a few seconds.'
  const url = `/w/${token}`
  const image = { url: `${url}/og.jpg`, width: 1200, height: 630, alt: `A ${FAM_LABEL[P.family]} wall generated from a device UUID` }
  return {
    title, description,
    alternates: { canonical: url },
    robots: { index: false, follow: true }, // one page per shared wall: not for search results
    openGraph: { title, description, url, type: 'website', siteName: 'UUIDWalls', images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  }
}

export default async function SharedWall({ params }: Props) {
  const { token } = await params
  if (!decodeWall(token)) notFound()
  return <HomeContent shared />
}
