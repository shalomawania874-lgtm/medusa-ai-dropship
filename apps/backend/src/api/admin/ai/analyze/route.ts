import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import AIService from "../../../../modules/ai"
import CJModuleService from "../../../../modules/cj/service"
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (await req.body) as any
  if (!body?.product) return res.status(400).json({ error: "product is required" })
  try {
    const ai = new AIService()
    const pricing = new CJModuleService().pricing(Number(body.product.cost || 0), Number(body.product.shipping || 0))
    const prompt = "You are the operating intelligence for a real dropshipping store. Analyze ONLY the verified supplier data below. Never invent sales, reviews, stock, shipping times, or profit. Return concise JSON with keys verdict, score_0_100, risks, title, description, seo_keywords. VERIFIED PRODUCT: " + JSON.stringify(body.product) + " VERIFIED PRICING: " + JSON.stringify(pricing)
    const text = await ai.text(prompt)
    res.json({ pricing, analysis: text })
  } catch (e: any) { res.status(502).json({ error: e.message }) }
}
