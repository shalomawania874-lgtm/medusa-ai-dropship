import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateOrderWorkflow, useRemoteQueryStep } from "@medusajs/medusa/core-flows"
import CJModuleService from "../modules/cj/service.js"

const sendStep = createStep("send-order-to-cj", async ({ order }: { order: any }) => {
  const existing = order.metadata?.cj_fulfillment
  if (existing?.externalId) return new StepResponse(existing, undefined)
  const cj = new CJModuleService()
  if (!cj.configured()) throw new Error("CJ_ACCESS_TOKEN is not configured; order was not sent to supplier")
  const items = (order.items || []).map((item: any) => ({
    cjVariantId: item.variant?.metadata?.cj_variant_id,
    cjSku: item.variant?.metadata?.cj_sku || item.variant?.sku,
    quantity: item.quantity,
    lineItemId: item.id,
  }))
  if (!items.length) throw new Error("Order has no fulfillable items")
  const result = await cj.createOrder({
    orderNumber: order.display_id ? String(order.display_id) : order.id,
    shipping: { ...order.shipping_address, email: order.email },
    items,
  })
  const externalId = result?.data?.orderId || result?.data?.orderNum || result?.data?.orderNumber || result?.orderId || result?.orderNum
  if (!externalId) throw new Error("CJ returned no supplier order identifier")
  const value = { externalId, raw: result }
  return new StepResponse(value, externalId)
})

export const sendOrderToCJWorkflow = createWorkflow("send-order-to-cj", ({ orderId }: { orderId: string }) => {
  const { data: orders } = useRemoteQueryStep({
    entry_point: "order",
    fields: ["id", "display_id", "email", "metadata", "items.*", "items.variant.*", "shipping_address.*"],
    variables: { filters: { id: orderId } },
  })
  const sent = sendStep({ order: orders[0] })
  const updated = updateOrderWorkflow.runAsStep({
    input: { id: orderId, user_id: "", metadata: { cj_fulfillment: sent } },
  })
  return new WorkflowResponse(updated)
})
