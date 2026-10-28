// What the seed field does with typed or pasted text (SPEC 7.3). Only used for typed input: legacy
// links (?uuid=...) still go straight to parseUUID so old walls render exactly as before.

export type SeedCheck =
  | { status: 'empty' }
  | { status: 'valid'; value: string }
  | { status: 'normalized'; value: string }
  | { status: 'short'; found: number }
  | { status: 'long'; found: number }
  | { status: 'badchars'; bad: string[] }

const dashed = (hex: string) => (hex.length === 32 ? `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` : hex)

/**
 * Accepts a 32-hex UUID (dashed or not, any case, braces, spaces or a urn:uuid: prefix) and a 16-hex
 * Android ID (the README tells Android users to use it). Anything else is explained, never padded
 * silently. The wall is not changed by the cleaning: the seed hashes the lowercase text with dashes
 * removed, so the dashed form of a UUID gives the same wall as the plain one.
 */
export function checkSeed(raw: string): SeedCheck {
  const text = raw.trim()
  if (text === '') return { status: 'empty' }
  const stripped = text.replace(/^urn:uuid:/i, '').replace(/[{}\s-]/g, '')
  const bad = [...new Set(stripped.replace(/[0-9a-f]/gi, '').split(''))].filter(Boolean)
  if (bad.length) return { status: 'badchars', bad: bad.slice(0, 3) }
  const hex = stripped.toLowerCase()
  if (hex.length !== 32 && hex.length !== 16) return hex.length < 32 ? { status: 'short', found: hex.length } : { status: 'long', found: hex.length }
  const value = dashed(hex)
  return { status: value === raw ? 'valid' : 'normalized', value }
}
