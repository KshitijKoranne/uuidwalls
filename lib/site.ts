const PRODUCTION_URL = 'https://uuidwalls.vercel.app'

/** Absolute origin for metadata and share images. Previews use their own URL so their cards can be tested. */
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  if (env.VERCEL_ENV === 'preview' && env.VERCEL_URL) return `https://${env.VERCEL_URL}`
  return PRODUCTION_URL
}
