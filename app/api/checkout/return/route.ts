import { handleReturn } from '@/lib/payments/handlers'
import { returnDeps } from '@/lib/payments/wiring'

export const GET = (req: Request) => handleReturn(req, returnDeps())
