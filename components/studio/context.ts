'use client'

import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { DlSizeKey } from '@/lib/payments/catalog'

export interface Studio {
  uuid: string
  family: string
  metaText: string
  wmEnabled: boolean
  dimScreen: string
  /** Callback ref for the hero canvas. */
  attachWallCanvas(el: HTMLCanvasElement | null): void
  // auth / payment
  user: User | null
  isPaid: boolean
  authChecked: boolean
  accountsEnabled: boolean
  openAuth(trigger: 'download' | 'unlock'): void
  openPay(): void
  signOut(): Promise<void>
  /** Opens sign-in when signed out, checkout when signed in and not paid. */
  unlock(): void
  // wall
  onUuidInput(value: string): void
  selectFamily(fam: string): void
  randomize(): void
  loadWall(uuid: string, fam: string): void
  toggleWatermark(): void
  download(size: DlSizeKey): void
  /** True when the wall came from a shared link (/w/<token>): there is no UUID, only its look. */
  sharedWall: boolean
  // sharing
  getShareLinks(): { privateUrl: string; rawUrl: string | null }
  copyShareLink(kind: 'private' | 'raw'): Promise<void>
  // misc
  showToast(msg: string, ms?: number): void
  shareOnX(): void
  getMyUUID(): void
}

export const StudioContext = createContext<Studio | null>(null)

export function useStudio(): Studio {
  const s = useContext(StudioContext)
  if (!s) throw new Error('useStudio must be used inside <StudioProvider>')
  return s
}
