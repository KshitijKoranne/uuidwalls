import { proxy } from './proxy'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return proxy(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT static files and images.
     * Required for Supabase session refresh on every request.
     */
    '/((?!_next/static|_next/image|favicon.ico|og-image.jpg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
