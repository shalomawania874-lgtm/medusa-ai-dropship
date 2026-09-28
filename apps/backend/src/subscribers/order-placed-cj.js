const { sendOrderToCJWorkflow } = require("../workflows/send-order-to-cj.js")

async function handler({ event, container }) {
  const query = container.resolve("query")
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "metadata",
      "items.*",
      "items.variant.*",
      "shipping_address.*",
    ],
    filters: { id: event.data.id },
  })

  const order = orders?.[0]
  if (!order) {
    throw new Error(
      "Order not found for payment capture: " + String(event.data.id)
    )
  }

  await sendOrderToCJWorkflow(container).run({
    input: { order },
  })
}

module.exports = {
  default: handler,
  config: {
    event: "payment.captured",
  },
}
