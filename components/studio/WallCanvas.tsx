'use client'

import { FAM_LABEL } from '@/lib/wall'
import { useStudio } from './context'

/** The stage canvas. A callback ref hands the element to the provider, which draws into it from a worker. */
export default function WallCanvas() {
  const { attachWallCanvas, attachCoarseCanvas, name, family } = useStudio()
  return (
    <>
      <canvas className="main" ref={attachWallCanvas} role="img" aria-label={`Wall: ${name}, ${FAM_LABEL[family]}, generated from your seed`} />
      <canvas className="coarse" ref={attachCoarseCanvas} aria-hidden="true" />
    </>
  )
}
