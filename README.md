# UUID Walls

Turn a device UUID into a one-of-a-kind generative wallpaper. Same UUID, same pattern, same size: the same wall.

- Six pattern families: Flow Field, Voronoi, Geometric, ASCII, Mandala, Wave.
- Drawn in your browser (Web Worker + OffscreenCanvas). Your UUID is not sent anywhere; share links carry the wall's look, not the UUID.
- Download Screen and Phone free; 2K and 4K are a one-time unlock.
- Save walls to My walls (kept on the device; syncs to your account when signed in).

## Develop

```bash
npm ci
cp .env.local.example .env.local   # dummy values are fine for local work; never commit real keys
npm run dev
```

| Command | What it does |
|---|---|
| `npm run lint`, `npm run typecheck` | ESLint, `tsc --noEmit` |
| `npm test` | Unit tests, including the golden determinism tests (the engine must draw exactly what v1 drew) |
| `npm run test:e2e` | Builds with `NEXT_PUBLIC_E2E=1` and runs the Playwright browser tests (`npx playwright install chromium` first) |
| `npm run test:perf` | 4K main-thread numbers, worker vs the old engine |

Stack: Next.js 16, React 19, TypeScript, Tailwind 4 (tokens in `app/globals.css`), Supabase (auth, optional library sync), Geist fonts.
Rendering engine: `lib/wall/`. Payments sit behind `lib/payments/` (provider interface). The SQL for saved walls is `supabase/migrations/` (apply manually).

Built by [KJR Labs](https://kjrlabs.in).
