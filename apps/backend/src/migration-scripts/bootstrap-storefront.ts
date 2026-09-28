import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function bootstrapStorefront({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const apiKeyService = container.resolve(Modules.API_KEY)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const { data: existingKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token", "title", "type", "sales_channels.*"],
    filters: { title: "Storefront Key", type: "publishable" },
  })

  let key = existingKeys?.[0]
  if (!key) {
    key = await apiKeyService.createApiKeys({
      title: "Storefront Key",
      type: "publishable",
      created_by: "system",
    })
  }

  let { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })

  if (!salesChannels?.length) {
    const created = await salesChannelService.createSalesChannels({
      name: "Default Sales Channel",
    })
    salesChannels = Array.isArray(created) ? created : [created]
  }

  for (const salesChannel of salesChannels) {
    const alreadyLinked = (key.sales_channels || []).some(
      (item: any) => item.id === salesChannel.id
    )
    if (!alreadyLinked) {
      try {
        await link.create({
          [Modules.API_KEY]: { publishable_key_id: key.id },
          [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id },
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (!message.toLowerCase().includes("already")) throw error
      }
    }
  }

  console.log("STOREFRONT_PUBLISHABLE_KEY=" + key.token)
  console.log("STOREFRONT_SALES_CHANNELS=" + salesChannels.map((x: any) => x.id).join(","))
}
