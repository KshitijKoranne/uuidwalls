import type { DlSizeKey } from '@/lib/payments/catalog'

export const DL_SIZES: Record<DlSizeKey, () => { w: number; h: number }> = {
  screen: () => { const d = window.devicePixelRatio || 1; return { w: Math.floor(window.innerWidth * d), h: Math.floor(window.innerHeight * d) } },
  '2k': () => ({ w: 2560, h: 1440 }),
  '4k': () => ({ w: 3840, h: 2160 }),
  mobile: () => ({ w: 1290, h: 2796 }),
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}
