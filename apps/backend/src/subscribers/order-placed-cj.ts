import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendOrderToCJWorkflow } from "../workflows/send-order-to-cj"

async function fulfill(container: any, orderId: string) {
  if (!orderId) return
  try {
    await sendOrderToCJWorkflow(container).run({ input: { orderId } })
  } catch (error) {
    const logger = container.resolve("logger") as any
    logger.error("CJ fulfillment failed for " + orderId + ": " + (error instanceof Error ? error.message : String(error)))
  }
}

export default async function handler({ event: { data }, container }: SubscriberArgs<{ id: string; order_id?: string }>) {
  await fulfill(container, data.order_id || data.id)
}

export const config: SubscriberConfig = { event: "order.placed" }
