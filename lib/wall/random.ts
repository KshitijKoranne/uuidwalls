import { FAMS } from './constants'

/** A random version-4 style UUID. UI only: walls themselves never use Math.random. */
export function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export function randomCard(): { uuid: string; fam: string } {
  return { uuid: randomUUID(), fam: FAMS[Math.floor(Math.random() * FAMS.length)] }
}

export const isFamily = (f: string | null | undefined): f is string => !!f && (FAMS as readonly string[]).includes(f)
