import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendOrderToCJWorkflow } from "../workflows/send-order-to-cj"

export default async function handler({ event, container }: SubscriberArgs<{ id: string }>) {
  const workflow = sendOrderToCJWorkflow(container)
  await workflow.run({ input: { order: event.data } })
}

export const config: SubscriberConfig = { event: "payment.captured" }
