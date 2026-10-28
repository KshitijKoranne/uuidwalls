import { notFound } from 'next/navigation'
import Lab from './Lab'

// Test harness for Playwright (parity, cancel race, long-task numbers). 404 unless the build was
// made with NEXT_PUBLIC_E2E=1, so it never ships on a normal build.
export default function LabPage() {
  if (process.env.NEXT_PUBLIC_E2E !== '1') notFound()
  return <Lab />
}
