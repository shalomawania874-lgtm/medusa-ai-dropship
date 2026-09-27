import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import CJModuleService from "../../../../modules/cj/service"
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (await req.body) as any
  const p = body?.product
  if (!p?.pid && !p?.id) return res.status(400).json({ error: "CJ product id is required" })
  try {
    const cj = new CJModuleService()
    const raw = await cj.product(String(p.pid || p.id))
    const data = raw?.data || raw
    const title = String(p.title || data?.productNameEn || data?.productName || "CJ Product")
    const sku = String(p.sku || data?.productSku || "CJ-" + (p.pid || p.id))
    const cost = Number(p.cost ?? data?.sellPrice ?? data?.productPrice ?? 0)
    const price = Math.max(100, Math.ceil((cost * Number(process.env.CJ_MARKUP || 2.2)) / 100) * 100)
    const images = Array.isArray(data?.productImageList) ? data.productImageList.map((x: any) => x?.url || x).filter(Boolean) : []
    const cjVariant = Array.isArray(data?.variants) ? data.variants[0] : (Array.isArray(data?.variantList) ? data.variantList[0] : null)
    const cjVariantId = cjVariant?.vid || cjVariant?.variantId || cjVariant?.variant_id || null
    const cjSku = cjVariant?.variantSku || cjVariant?.sku || sku
    const result = await createProductsWorkflow(req.scope).run({ input: { products: [{
      title,
      description: String(p.description || data?.description || title),
      status: "published",
      thumbnail: images[0],
      images: images.slice(0, 10).map((url: string) => ({ url })),
      metadata: { supplier: "cjdropshipping", cj_product_id: String(p.pid || p.id), supplier_sku: sku, supplier_cost: cost },
      options: [{ title: "Default", values: ["Default"] }],
      variants: [{ title: "Default", sku, metadata: { cj_variant_id: cjVariantId, cj_sku: cjSku }, options: { Default: "Default" }, prices: [{ amount: price, currency_code: (process.env.PESAPAL_CURRENCY || "UGX").toLowerCase() }] }],
    }] } })
    res.json({ product: result.result[0], supplier: data })
  } catch (e: any) { res.status(502).json({ error: e.message }) }
}
