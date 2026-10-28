import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

// Only pages meant for search. Shared walls (/w/...) are noindex and personal; /walls is per user.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  return [
    { url: `${base}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/refund`, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
