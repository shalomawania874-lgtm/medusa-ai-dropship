import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import CJModuleService from "../../../../../modules/cj/service"
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = String(req.query.id || "").trim()
  if (!id) return res.status(400).json({ error: "id is required" })
  try { res.json(await new CJModuleService().product(id)) }
  catch (e: any) { res.status(502).json({ error: e.message }) }
}
