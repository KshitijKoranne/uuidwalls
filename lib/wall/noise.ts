export function mkNoise(seed: number) {
  const perm = new Uint8Array(512), p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  let s = seed >>> 0
  const r = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }
  for (let i = 255; i > 0; i--) { const j = r() * i | 0; const t = p[i]; p[i] = p[j]; p[j] = t }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
  const g = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]
  const dot = (g: number[], x: number, y: number) => g[0] * x + g[1] * y
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
  const lerp = (a: number, b: number, t: number) => a + t * (b - a)
  return (x: number, y: number) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255
    x -= Math.floor(x); y -= Math.floor(y)
    const u = fade(x), v = fade(y), a = perm[X] + Y, b = perm[X + 1] + Y
    return lerp(lerp(dot(g[perm[a] % 8], x, y), dot(g[perm[b] % 8], x - 1, y), u),
      lerp(dot(g[perm[a + 1] % 8], x, y - 1), dot(g[perm[b + 1] % 8], x - 1, y - 1), u), v)
  }
}
