const { ContainerRegistrationKeys } = require("@medusajs/framework/utils")
const {
  createInventoryLevelsWorkflow,
  updateInventoryLevelsWorkflow,
} = require("@medusajs/medusa/core-flows")
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
    fields: [
      "id",
      "title",
      "metadata",
      "variants.id",
      "variants.sku",
      "variants.metadata",
      "variants.inventory_items.inventory.id",
      "variants.inventory_items.inventory.location_levels.*",
    ],
  })

  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })
  const defaultLocation = locations?.[0]

  if (!defaultLocation) {
    logger.warn("CJ inventory sync skipped: no Medusa stock location exists")
    return
  }

  for (const product of products || []) {
    for (const variant of product.variants || []) {
      const sku =
        variant.metadata?.cj_sku ||
        product.metadata?.supplier_sku ||
        variant.sku

      if (!sku) continue

      try {
        const stock = await cj.stockBySku(String(sku))
        const raw = stock?.data
        const qty = Array.isArray(raw)
          ? raw.reduce(
              (n, x) => n + Number(x.storageNum ?? x.stock ?? 0),
              0
            )
          : Number(raw?.stock ?? raw?.storageNum ?? NaN)

        if (!Number.isFinite(qty)) {
          logger.warn("CJ returned no usable stock for " + sku)
          continue
        }

        const inventoryItems = (variant.inventory_items || [])
          .map((link) => link.inventory)
          .filter(Boolean)

        for (const inventory of inventoryItems) {
          const level =
            (inventory.location_levels || []).find(
              (item) => item.location_id === defaultLocation.id
            ) || inventory.location_levels?.[0]

          if (level) {
            await updateInventoryLevelsWorkflow(container).run({
              input: {
                updates: [
                  {
                    id: level.id,
                    inventory_item_id: inventory.id,
                    location_id: level.location_id,
                    stocked_quantity: Math.max(0, Math.floor(qty)),
                  },
                ],
              },
            })
          } else {
            await createInventoryLevelsWorkflow(container).run({
              input: {
                inventory_levels: [
                  {
                    inventory_item_id: inventory.id,
                    location_id: defaultLocation.id,
                    stocked_quantity: Math.max(0, Math.floor(qty)),
                  },
                ],
              },
            })
          }
        }

        logger.info(
          "CJ stock synced " +
            sku +
            ": " +
            Math.max(0, Math.floor(qty))
        )
      } catch (error) {
        logger.warn(
          "CJ stock sync failed for " +
            sku +
            ": " +
            (error instanceof Error ? error.message : String(error))
        )
      }
    }
  }
}

module.exports = cjHealthAndSyncJob
module.exports.config = {
  name: "cj-health-and-sync",
  schedule: "*/15 * * * *",
}
