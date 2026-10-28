'use client'

import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { useLibrary } from '@/hooks/useLibrary'
import type { ToastOptions, ToastState } from '@/hooks/useToast'
import type { DlSizeKey } from '@/lib/payments/catalog'
import type { SavedWall } from '@/lib/library/types'
import type { UUIDParams } from '@/lib/wall'

export type PreviewMode = 'full' | 'desktop' | 'phone'
export type SeedKind = 'sample' | 'yours' | 'random' | 'hidden'
export type UnlockStep = 'intro' | 'signin' | 'pay' | 'confirming' | 'success' | 'pending' | 'cancelled' | 'error'

export type DialogState =
  | null
  | { kind: 'find' }
  | { kind: 'share' }
  | { kind: 'signin'; trigger: 'nav' | 'sync' }
  | { kind: 'unlock'; size: 'screen-free' | '2k' | '4k'; step: UnlockStep }

export interface Studio {
  // the wall
  uuid: string
  family: string
  P: UUIDParams
  token: string
  name: string
  seedKind: SeedKind
  /** The wall came from a link or the library: there is no UUID, only its look. */
  sharedWall: boolean
  render: { state: 'ready' | 'busy' | 'error'; progress: number; label: string }
  previewMode: PreviewMode
  setPreviewMode(m: PreviewMode): void
  panelOpen: boolean
  setPanelOpen(open: boolean): void
  heroGone: boolean
  hintVisible: boolean
  attachWallCanvas(el: HTMLCanvasElement | null): void
  /** The quick low-resolution pass drawn behind the sharp canvas while it renders. */
  attachCoarseCanvas(el: HTMLCanvasElement | null): void
  setSeed(normalized: string): void
  selectFamily(fam: string): void
  stepFamily(dir: 1 | -1): void
  randomize(): void
  loadWall(uuid: string, fam: string): void
  loadToken(token: string, opts?: { fromWalls?: boolean }): boolean
  retryRender(): void
  backToWalls: boolean
  // sizes and download
  size: DlSizeKey
  chooseSize(k: DlSizeKey): void
  download(): void
  downloading: boolean
  cancelDownload(): void
  wmEnabled: boolean
  toggleWatermark(): void
  dimScreen: string
  // library
  library: ReturnType<typeof useLibrary>
  saved: SavedWall | undefined
  toggleSave(): void
  syncNudge: boolean
  dismissSyncNudge(): void
  // account
  user: User | null
  isPaid: boolean
  authChecked: boolean
  accountsEnabled: boolean
  signOut(): Promise<void>
  confirmPaid(): Promise<boolean>
  markPaid(): void
  // dialogs
  dialog: DialogState
  openDialog(d: NonNullable<DialogState>): void
  closeDialog(): void
  // sharing
  getShareLinks(): { privateUrl: string; rawUrl: string | null }
  copyShareLink(kind: 'private' | 'raw'): Promise<void>
  shareOnX(): void
  // misc
  showToast(text: string, opts?: ToastOptions): void
  /** For modal dialogs: they render the toast inside themselves (a modal makes the page behind inert). */
  toastView: { toast: ToastState; hover(over: boolean): void; dismiss(): void }
  modalOpened(delta: 1 | -1): void
}

export const StudioContext = createContext<Studio | null>(null)

export function useStudio(): Studio {
  const s = useContext(StudioContext)
  if (!s) throw new Error('useStudio must be used inside <StudioProvider>')
  return s
}
