// In-memory limiter: per serverless instance, enough to stop accidental spam (not a security boundary).
export function createRateLimiter(max: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, { count: number; resetAt: number }>()
  return (key: string): boolean => {
    const t = now()
    const e = hits.get(key)
    if (!e || t > e.resetAt) { hits.set(key, { count: 1, resetAt: t + windowMs }); return false }
    if (e.count >= max) return true
    e.count++
    return false
  }
}
