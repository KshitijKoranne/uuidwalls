'use client'

import { useStudio } from './context'

/** The full-bleed hero canvas. The provider owns the element and renders into it from a worker. */
export default function WallCanvas() {
  const { attachWallCanvas } = useStudio()
  return <canvas ref={attachWallCanvas} role="img" aria-label="Generative wallpaper rendered from your UUID" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}
