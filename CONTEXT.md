# UUIDWalls — Project Context

## What it is
A generative wallpaper web app that converts any device UUID into a deterministic, unique wallpaper. Six pattern families: Flow Field, Voronoi, Geometric, ASCII, Mandala, Wave. Built and deployed at uuidwalls.vercel.app.

## Business model
- Free: Screen + mobile resolution downloads
- Paid (₹99 one-time): 2K (2560×1440) + 4K (3840×2160) lifetime unlock
- Payment via Razorpay Payment Links API

## Tech stack
- Next.js 16 (App Router, Turbopack)
- TypeScript, Tailwind CSS
- Supabase (auth + database) — project ID: bakicoxzshulebkxbfft (Mumbai region)
- Razorpay Payment Links API (test mode: rzp_test_SaGT7Y5Iu1iQad)
- Deployed on Vercel (uuidwalls.vercel.app)
- GitHub: github.com/KshitijKoranne/uuidwalls

## Supabase setup
- Auth: Google OAuth + magic link email
- Redirect URL: https://uuidwalls.vercel.app/auth/callback
- Table: paid_users (user_id, email, razorpay_order_id, razorpay_payment_id, paid_at)
- RLS enabled: users can only read their own record
- Admin client (service role) used server-side for payment recording

## Key env vars (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://bakicoxzshulebkxbfft.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
RAZORPAY_KEY_ID=rzp_test_SaGT7Y5Iu1iQad
RAZORPAY_KEY_SECRET=<secret>
NEXT_PUBLIC_APP_URL=https://uuidwalls.vercel.app
```

## Project file structure
```
app/
  page.tsx              — main page, full canvas engine + auth + payment UI
  layout.tsx            — root layout, Google Fonts
  globals.css           — design tokens, modal styles
  api/
    razorpay/
      create-order/route.ts  — creates Razorpay payment link via API
      callback/route.ts      — handles Razorpay redirect after payment
  auth/
    callback/route.ts   — Supabase OAuth code exchange
    signout/route.ts    — server-side signout (clears SSR cookies)
components/
  AuthModal.tsx         — Google OAuth + magic link sign in
  PayModal.tsx          — payment confirmation modal
lib/
  supabase/
    client.ts           — browser Supabase client
    server.ts           — server Supabase client (cookies)
    admin.ts            — admin client (service role, server only)
proxy.ts                — session refresh middleware (Next.js proxy)
```

## Payment flow
1. User clicks "Unlock 2K/4K · ₹99"
2. If not logged in → AuthModal (Google or magic link)
3. If logged in but not paid → PayModal
4. PayModal POSTs to /api/razorpay/create-order
5. Server creates Razorpay payment link with callback_url including user_id
6. User redirected to Razorpay hosted payment page
7. After payment → Razorpay redirects to /api/razorpay/callback
8. Callback verifies (skips sig in test mode), writes to paid_users table
9. Redirects to /?payment=success
10. Page reads ?payment=success, re-checks paid_users, shows unlock badge

## Canvas engine
- Verbatim port of original vanilla JS to TypeScript in page.tsx
- Six renderers: drawFlowFieldChunked, drawVoronoiChunked, drawGeometric, drawASCII, drawMandala, drawWave
- Voronoi uses hq=true flag for pixel-perfect hero/download rendering (pxStep=1)
- hq=false for gallery thumbnails (coarse step, faster)
- Chunked rendering with requestAnimationFrame to avoid blocking UI
- Progress bar shown for slow renders (Voronoi, Flow Field)

## Current status
- Full payment flow working end-to-end (test mode) ✅
- Google OAuth working (restricted to test users — app not yet published on Google)
- Razorpay in test mode — waiting for Razorpay to finish reviewing business site before live keys

## To go live checklist
- [ ] Razorpay: get live keys once business site review completes
- [ ] Razorpay: update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel to live keys
- [ ] Google: publish OAuth app (Google Cloud Console → OAuth consent screen → Publish)
- [ ] Google: add uuidwalls.vercel.app to authorized domains
- [ ] Signature verification: remove test mode bypass in callback/route.ts (already enforced in live mode)

## Design system
- Colors: --ink (#0a0908), --paper (#f0ede8), opacity variants p85/p55/p30/p15/p08/p05
- Fonts: Cormorant Garamond (serif), IBM Plex Mono (mono), Outfit (sans)
- No emojis in UI (house rule)

## Builder
Kshitij Koranne (KJR Labs — kjrlabs.in)
X: @kshitijkoranne
Email: kjrlabs9@gmail.com
