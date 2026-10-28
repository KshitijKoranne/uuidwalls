'use client'

import { useId } from 'react'
import Dialog from '@/components/ui/Dialog'
import { useStudio } from '@/components/studio/context'

/** First sign-in with walls on this device: ask, never merge silently (SPEC 8.8). */
export default function MergeDialog() {
  const { library } = useStudio()
  const id = useId()
  const n = library.mergePrompt?.count ?? 0
  return (
    <Dialog onClose={library.declineMerge} labelledBy={id}>
      <h2 id={id}>Add {n === 1 ? 'the wall' : `the ${n} walls`} from this device to your account?</h2>
      <p>They’ll be available wherever you sign in. We store the wall, never your UUID.</p>
      <div className="row">
        <button className="btn primary lg" type="button" onClick={() => void library.acceptMerge()}>Add {n === 1 ? 'it' : 'them'}</button>
        <button className="btn lg" type="button" onClick={library.declineMerge}>Not now</button>
      </div>
    </Dialog>
  )
}
