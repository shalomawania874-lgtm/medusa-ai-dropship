import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import CJModuleService from "../modules/cj/service.js"

export default async function cjHealthAndSyncJob(container: MedusaContainer) {
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
  for (const product of products as any[]) {
    const sku = product.metadata?.supplier_sku
    if (!sku) continue
    try {
      const stock = await cj.stockBySku(sku)
      const qty = Array.isArray(stock?.data)
        ? stock.data.reduce((n: number, x: any) => n + Number(x.storageNum ?? x.stock ?? 0), 0)
        : Number(stock?.data?.stock ?? 0)
      logger.info("CJ stock " + sku + ": " + qty)
    } catch (e) {
      logger.warn("CJ stock sync skipped for " + sku + ": " + (e instanceof Error ? e.message : String(e)))
    }
  }
}
export const config = { name: "cj-health-and-sync", schedule: "*/15 * * * *" }
