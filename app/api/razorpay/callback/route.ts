// Payment links issued before the provider refactor still point here. Same handler as the neutral route.
import { handleReturn } from '@/lib/payments/handlers'
import { returnDeps } from '@/lib/payments/wiring'

export const GET = (req: Request) => handleReturn(req, returnDeps())
