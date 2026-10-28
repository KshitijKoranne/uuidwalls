/**
 * Vercel exposes the deployment kind to the browser as NEXT_PUBLIC_VERCEL_ENV
 * ('production' | 'preview' | 'development'). Previews share production's Supabase project and must
 * never take real payments, so sign-in and checkout are switched off there. Unset (local dev, tests)
 * counts as enabled so the flows stay testable.
 */
export const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
export const ACCOUNTS_ENABLED = !IS_PREVIEW
