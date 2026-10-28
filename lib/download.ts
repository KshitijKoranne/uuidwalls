import type { DlSizeKey } from '@/lib/payments/catalog'

export const DL_SIZES: Record<DlSizeKey, () => { w: number; h: number }> = {
  screen: () => { const d = window.devicePixelRatio || 1; return { w: Math.floor(window.innerWidth * d), h: Math.floor(window.innerHeight * d) } },
  '2k': () => ({ w: 2560, h: 1440 }),
  '4k': () => ({ w: 3840, h: 2160 }),
  mobile: () => ({ w: 1290, h: 2796 }),
}

/** File name part for a wall name: "Cobalt Tide" -> "cobalt-tide". No UUID, no hardware id. */
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'wall'

export const SIZE_LABEL: Record<DlSizeKey, string> = { screen: 'Screen', mobile: 'Phone', '2k': '2K', '4k': '4K' }

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}
