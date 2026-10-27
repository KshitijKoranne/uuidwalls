import { handleWebhook } from '@/lib/payments/handlers'
import { webhookDeps } from '@/lib/payments/wiring'

export const POST = (req: Request) => handleWebhook(req, webhookDeps())
