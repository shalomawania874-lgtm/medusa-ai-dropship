import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateOrderWorkflow, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import CJModuleService from "../modules/cj/service"

const sendStep = createStep("send-order-to-cj", async ({ order }: { order: any }) => {
  const existing = order.metadata?.cj_fulfillment
  if (existing?.externalId) return new StepResponse(existing)

  const cj = new CJModuleService()
  if (!cj.configured()) throw new Error("CJ_ACCESS_TOKEN is not configured; order was not sent to supplier")

  const paymentStatus = order.payment_collections?.[0]?.payments?.some((p: any) =>
    p.captured_at || p.captured_at === 0 || p.status === "captured"
  )
  if (!paymentStatus) throw new Error("Order is not payment-captured; supplier fulfillment is blocked")

  const result = await cj.createOrder({
    orderNumber: order.display_id ? String(order.display_id) : order.id,
    shipping: { ...order.shipping_address, email: order.email },
    items: (order.items || []).map((item: any) => ({
      cjVariantId: item.variant?.metadata?.cj_variant_id || undefined,
      cjSku: item.variant?.metadata?.cj_sku || item.variant?.sku || undefined,
      quantity: item.quantity,
      lineItemId: item.id,
    })),
  })
  const externalId = result?.data?.orderId || result?.data?.orderNum || result?.data?.orderNumber || result?.orderId || result?.orderNum
  if (!externalId) throw new Error("CJ returned no identifiable supplier order ID")
  return new StepResponse({ externalId, raw: result }, externalId)
})

export const sendOrderToCJWorkflow = createWorkflow("send-order-to-cj", ({ orderId }: { orderId: string }) => {
  const { data: orders } = useQueryGraphStep({
    entity: "order",
    fields: [
      "id", "display_id", "email", "metadata", "items.*", "items.variant.*",
      "shipping_address.*", "payment_collections.*", "payment_collections.payments.*",
    ],
    filters: { id: orderId },
    options: { throwIfKeyNotFound: true },
  })
  const sent = sendStep({ order: orders[0] })
  const updated = updateOrderWorkflow.runAsStep({
    input: { id: orderId, user_id: "", metadata: { cj_fulfillment: sent } },
  })
  return new WorkflowResponse(updated)
})
