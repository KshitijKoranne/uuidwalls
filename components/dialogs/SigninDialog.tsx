'use client'

import { useId } from 'react'
import AuthForm from '@/components/auth/AuthForm'
import Dialog from '@/components/ui/Dialog'
import { useStudio } from '@/components/studio/context'

export default function SigninDialog() {
  const s = useStudio()
  const id = useId()
  const sync = s.dialog?.kind === 'signin' && s.dialog.trigger === 'sync'
  return (
    <Dialog onClose={s.closeDialog} labelledBy={id}>
      <h2 id={id}>{sync ? 'Sign in to sync your walls' : 'Sign in to UUID Walls'}</h2>
      <p>{sync ? 'Keep the walls you saved on every device you sign in on.' : 'Sign in to keep your walls across devices and to unlock 2K & 4K.'}</p>
      <AuthForm />
    </Dialog>
  )
}
