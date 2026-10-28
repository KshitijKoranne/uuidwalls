import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

// /w/ is deliberately NOT disallowed: link-preview bots (Slack, others) obey robots.txt and must
// still fetch the share card. Shared pages stay out of search with a noindex meta tag instead.
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl()
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/auth/', '/lab'] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
