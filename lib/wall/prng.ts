// Verbatim ports from v1. The int32 shift behaviour (`s >> 17` on a signed value, read back with
// `>>> 0`) is part of the output. Do not "fix" or modernise.
export function mkPRNG(seed: number) {
  let s = seed >>> 0; if (!s) s = 2463534242
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }
}

export function uuidSeed(uuid: string) {
  const c = uuid.replace(/-/g, '').toLowerCase(); let h = 2166136261
  for (let i = 0; i < c.length; i++) { h ^= c.charCodeAt(i); h = (h * 16777619) >>> 0 }
  return h
}
