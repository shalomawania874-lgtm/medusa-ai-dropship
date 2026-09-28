const { ContainerRegistrationKeys } = require("@medusajs/framework/utils")
const CJModuleService = require("../modules/cj/service.js")

async function cjHealthAndSyncJob(container) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const cj = new CJModuleService()
  const health = await cj.health()

  logger.info("CJ supplier health: " + JSON.stringify(health))
  if (!health.ok) return

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata", "variants.*"],
  })

  for (const product of products || []) {
    const sku = product.metadata?.supplier_sku
    if (!sku) continue

    try {
      const stock = await cj.stockBySku(sku)
      const qty = Array.isArray(stock?.data)
        ? stock.data.reduce((n, x) => n + Number(x.storageNum ?? x.stock ?? 0), 0)
        : Number(stock?.data?.stock ?? 0)
      logger.info("CJ stock " + sku + ": " + qty)
    } catch (error) {
      logger.warn(
        "CJ stock sync skipped for " + sku + ": " +
          (error instanceof Error ? error.message : String(error))
      )
    }
  }
}

module.exports = cjHealthAndSyncJob
module.exports.config = {
  name: "cj-health-and-sync",
  schedule: "*/15 * * * *",
}
