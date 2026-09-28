import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import CJModuleService from "../modules/cj/service.js"

const sendStep = createStep("send-order-to-cj", async ({ order }: { order: any }) => {
  const cj = new CJModuleService()
  if (!cj.configured()) {
    throw new Error("CJ_ACCESS_TOKEN is not configured; order was not sent to supplier")
  }
  const items = (order.items || []).map((item: any) => ({
    cjVariantId: item.variant?.metadata?.cj_variant_id,
    cjSku: item.variant?.metadata?.cj_sku || item.variant?.sku,
    quantity: item.quantity,
    lineItemId: item.id,
  }))
  if (!items.length) throw new Error("Order has no fulfillment items")
  const result = await cj.createOrder({
    orderNumber: order.display_id ? String(order.display_id) : order.id,
    shipping: { ...(order.shipping_address || {}), email: order.email },
    items,
  })
  const externalId = result?.data?.orderId || result?.data?.orderNum || result?.orderId || result?.orderNum
  if (!externalId) throw new Error("CJ returned no supplier order identifier")
  return new StepResponse({ externalId, raw: result }, externalId)
})

export const sendOrderToCJWorkflow = createWorkflow("send-order-to-cj", ({ order }: { order: any }) => {
  const sent = sendStep({ order })
  return new WorkflowResponse(sent)
})
