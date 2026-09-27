import OpenAI from "openai"
export default class AIService {
  private client: OpenAI | null = null
  constructor() { if (process.env.OPENAI_API_KEY) this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) }
  configured() { return Boolean(this.client) }
  async text(prompt: string) {
    if (!this.client) throw new Error("OPENAI_API_KEY is not configured")
    const response = await this.client.responses.create({ model: process.env.OPENAI_MODEL || "gpt-5.6-luna", input: prompt })
    return response.output_text
  }
}
