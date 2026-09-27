import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import CJModuleService from "../../../../../modules/cj/service"
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = String(req.query.q || "").trim()
  if (!q) return res.status(400).json({ error: "q is required" })
  try { res.json(await new CJModuleService().search(q, Number(req.query.page || 1), Number(req.query.size || 20))) }
  catch (e: any) { res.status(502).json({ error: e.message }) }
}
