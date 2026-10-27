import { handleCheckout } from '@/lib/payments/handlers'
import { checkoutDeps } from '@/lib/payments/wiring'

export const POST = (req: Request) => handleCheckout(req, checkoutDeps())
