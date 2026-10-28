import { FAQ, type FaqItem } from '@/lib/content/faq'
import { PRICE } from '@/lib/payments/catalog'

/** Serialise for a <script type="application/ld+json"> tag: "<" is escaped so content can never close the tag. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')

export function webApplicationLd(url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'UUID Walls',
    url,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    description: 'Turns a device UUID into a one-of-a-kind generative wallpaper, drawn in your browser.',
    offers: [
      { '@type': 'Offer', name: 'Screen and Mobile downloads', price: '0', priceCurrency: PRICE.currency },
      { '@type': 'Offer', name: '2K and 4K downloads, one-time unlock', price: String(PRICE.amountMinor / 100), priceCurrency: PRICE.currency },
    ],
    creator: { '@type': 'Organization', name: 'KJR Labs', url: 'https://kjrlabs.in' },
  }
}

export function faqPageLd(items: FaqItem[] = FAQ) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }
}
