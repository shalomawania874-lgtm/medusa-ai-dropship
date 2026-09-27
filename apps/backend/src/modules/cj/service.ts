export type CJProduct = Record<string, any>

export default class CJModuleService {
  private baseUrl = process.env.CJ_BASE_URL || "https://developers.cjdropshipping.com/api2.0/v1"
  private token = process.env.CJ_ACCESS_TOKEN || ""
  private markup = Number(process.env.CJ_MARKUP || "2.2")
  private minMargin = Number(process.env.CJ_MIN_MARGIN || "0.35")

  configured() { return Boolean(this.token) }

  private async request(path: string, init: RequestInit = {}) {
    if (!this.token) throw new Error("CJ_ACCESS_TOKEN is not configured")
    const response = await fetch(this.baseUrl + path, {
      ...init,
      headers: { "CJ-Access-Token": this.token, "Content-Type": "application/json", ...(init.headers || {}) },
    })
    const text = await response.text()
    let data: any
    try { data = JSON.parse(text) } catch { data = { raw: text } }
    if (!response.ok || data?.result === false) throw new Error(data?.message || ("CJ request failed (" + response.status + ")"))
    return data
  }

  async health() {
    if (!this.token) return { configured: false, ok: false, reason: "CJ_ACCESS_TOKEN missing" }
    try { await this.request("/setting/get"); return { configured: true, ok: true } }
    catch (error: any) { return { configured: true, ok: false, reason: error.message } }
  }

  async search(keyword: string, page = 1, size = 20) {
    const q = new URLSearchParams({ page: String(page), size: String(Math.min(size, 100)), keyWord: keyword })
    return this.request("/product/listV2?" + q.toString())
  }

  async product(id: string) { return this.request("/product/query?pid=" + encodeURIComponent(id) + "&features=enable_combine") }
  async stockBySku(sku: string) { return this.request("/product/stock/queryBySku?sku=" + encodeURIComponent(sku)) }
  async track(trackingNumber: string) { return this.request("/logistic/trackInfo?trackNumber=" + encodeURIComponent(trackingNumber)) }

  async createOrder(input: { orderNumber: string; shipping: any; items: any[]; warehouse?: string; logisticName?: string }) {
    const shipping = input.shipping || {}
    const logisticName = input.logisticName || process.env.CJ_LOGISTIC_NAME
    if (!logisticName) throw new Error("CJ_LOGISTIC_NAME is required before live fulfillment")
    const products = input.items.map((item) => ({
      vid: item.cjVariantId || undefined,
      sku: item.cjSku || undefined,
      quantity: Number(item.quantity),
      storeLineItemId: item.lineItemId,
    }))
    if (products.some((x) => !x.vid && !x.sku)) throw new Error("Every order item must contain a CJ variant ID or SKU")
    return this.request("/shopping/order/createOrderV3", {
      method: "POST",
      body: JSON.stringify({
        orderNumber: input.orderNumber,
        shippingZip: shipping.postal_code || "",
        shippingCountryCode: String(shipping.country_code || "").toUpperCase(),
        shippingCountry: shipping.country_code || "",
        shippingProvince: shipping.province || "",
        shippingCity: shipping.city || "",
        shippingCounty: shipping.county || "",
        shippingPhone: shipping.phone || "",
        shippingCustomerName: [shipping.first_name, shipping.last_name].filter(Boolean).join(" "),
        shippingAddress: shipping.address_1 || "",
        shippingAddress2: shipping.address_2 || "",
        email: shipping.email || "",
        logisticName,
        fromCountryCode: process.env.CJ_FROM_COUNTRY || "CN",
        shopLogisticsType: 2,
        orderFlow: 1,
        products,
        payType: 3,
      }),
    })
  }

  pricing(cost: number, shipping = 0) {
    const landed = cost + shipping
    const sale = Math.ceil((landed * this.markup) / 100) * 100
    const margin = sale > 0 ? (sale - landed) / sale : 0
    return { landedCost: landed, suggestedPrice: sale, margin, meetsMargin: margin >= this.minMargin }
  }
}
