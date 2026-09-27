import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendOrderToCJWorkflow } from "../workflows/send-order-to-cj"

export default async function handler({ event: { data }, container }: SubscriberArgs<{ id: string; order_id?: string }>) {
  const logger = container.resolve("logger") as any
  try {
    let orderId = data.order_id
    if (!orderId) {
      const query = container.resolve("query") as any
      const { data: payments } = await query.graph({
        entity: "payment",
        fields: ["id", "payment_collection.orders.*"],
        filters: { id: data.id },
      })
      orderId = payments?.[0]?.payment_collection?.orders?.[0]?.id
    }
    if (!orderId) {
      logger.warn("payment.captured received without a resolvable order: " + data.id)
      return
    }
    await sendOrderToCJWorkflow(container).run({ input: { orderId } })
  } catch (error) {
    logger.error("CJ fulfillment after payment capture failed: " + (error instanceof Error ? error.message : String(error)))
  }
}

export const config: SubscriberConfig = { event: "payment.captured" }
