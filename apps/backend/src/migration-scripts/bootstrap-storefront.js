const { ContainerRegistrationKeys, Modules } = require("@medusajs/framework/utils")

module.exports = async function bootstrapStorefront({ container }) {
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

  let salesChannels = key.sales_channels || []

  if (!salesChannels.length) {
    const result = await query.graph({
      entity: "sales_channel",
      fields: ["id", "name"],
    })
    salesChannels = result.data || []
  }

  if (!salesChannels.length) {
    const created = await salesChannelService.createSalesChannels({
      name: "Default Sales Channel",
    })
    salesChannels = Array.isArray(created) ? created : [created]
  }

  for (const salesChannel of salesChannels) {
    const alreadyLinked = (key.sales_channels || []).some(
      (item) => item.id === salesChannel.id
    )

    if (alreadyLinked) continue

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

  console.log("STOREFRONT_PUBLISHABLE_KEY=" + String(key.token))
  console.log(
    "STOREFRONT_SALES_CHANNELS=" +
      salesChannels.map((item) => item.id).join(",")
  )
}
