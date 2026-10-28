import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Derive origin from the incoming request — works in any environment
  const origin = new URL(req.url).origin
  // 303 so the browser follows with GET (the default 307 would replay the POST)
  return NextResponse.redirect(new URL('/', origin), 303)
}
