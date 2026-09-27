import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import CJModuleService from "../../../../modules/cj/service"
import AIService from "../../../../modules/ai"
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({ ai: { configured: new AIService().configured() }, cj: await new CJModuleService().health(), timestamp: new Date().toISOString() })
}
