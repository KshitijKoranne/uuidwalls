/**
 * Where to send the browser after sign-in. Only same-site paths are allowed. Anything else becomes "/".
 * Rejects "//host", "/\host" and "@host" tricks (`${origin}${next}` with next="@evil.com" would
 * otherwise produce https://site@evil.com, a link to evil.com).
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || next[0] !== '/' || next[1] === '/' || next[1] === '\\') return '/'
  if (/[\u0000-\u001f\u007f]/.test(next)) return '/'
  try {
    const base = 'https://base.invalid'
    return new URL(next, base).origin === base ? next : '/'
  } catch { return '/' }
}
