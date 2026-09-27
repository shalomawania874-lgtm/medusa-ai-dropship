import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendOrderToCJWorkflow } from "../workflows/send-order-to-cj"

export default async function handler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  try {
    await sendOrderToCJWorkflow(container).run({ input: { orderId: data.id } })
  } catch (error) {
    const logger = container.resolve("logger") as any
    logger.error("CJ fulfillment failed for " + data.id + ": " + (error instanceof Error ? error.message : String(error)))
  }
}
export const config: SubscriberConfig = { event: "order.placed" }
