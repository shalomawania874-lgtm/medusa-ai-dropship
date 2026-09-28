const { sendOrderToCJWorkflow } = require("../workflows/send-order-to-cj.js")

async function handler({ event, container }) {
  try {
    await sendOrderToCJWorkflow(container).run({
      input: { orderId: event.data.id },
    })
  } catch (error) {
    const logger = container.resolve("logger")
    logger.error(
      "CJ fulfillment failed for " + event.data.id + ": " +
        (error instanceof Error ? error.message : String(error))
    )
    throw error
  }
}

module.exports = handler
module.exports.config = {
  event: "payment.captured",
}
