import { Global } from "../global"
import { Log } from "../util/log"
import path from "path"
import z from "zod"

export namespace Models {
  const log = Log.create({ service: "models" })
  const filepath = path.join(Global.Path.cache, "models.json")

  const USER_API_URL = "http://localhost:8000/api/models?scope=cloudmodel"

  interface UserAPIModel {
    name: string
    model_id: string
    provider: string
    api_base_url: string
    model_type: string
    context_window: string
    input_price: number
    output_price: number
    is_active: boolean
    created_at?: string
  }

  interface UserAPIResponse {
    models: UserAPIModel[]
    total: number
  }

  export const Model = z.object({
    id: z.string(),
    name: z.string(),
    family: z.string().optional(),
    release_date: z.string(),
    attachment: z.boolean(),
    reasoning: z.boolean(),
    temperature: z.boolean(),
    tool_call: z.boolean(),
    interleaved: z
      .union([
        z.literal(true),
        z
          .object({
            field: z.enum(["reasoning_content", "reasoning_details"]),
          })
          .strict(),
      ])
      .optional(),
    cost: z
      .object({
        input: z.number(),
        output: z.number(),
        cache_read: z.number().optional(),
        cache_write: z.number().optional(),
        context_over_200k: z
          .object({
            input: z.number(),
            output: z.number(),
            cache_read: z.number().optional(),
            cache_write: z.number().optional(),
          })
          .optional(),
      })
      .optional(),
    limit: z.object({
      context: z.number(),
      input: z.number().optional(),
      output: z.number(),
    }),
    modalities: z
      .object({
        input: z.array(z.enum(["text", "audio", "image", "video", "pdf"])),
        output: z.array(z.enum(["text", "audio", "image", "video", "pdf"])),
      })
      .optional(),
    experimental: z.boolean().optional(),
    status: z.enum(["alpha", "beta", "deprecated"]).optional(),
    options: z.record(z.string(), z.any()),
    headers: z.record(z.string(), z.string()).optional(),
    provider: z.object({ npm: z.string() }).optional(),
    variants: z.record(z.string(), z.record(z.string(), z.any())).optional(),
  })
  export type Model = z.infer<typeof Model>

  export const Provider = z.object({
    api: z.string().optional(),
    name: z.string(),
    env: z.array(z.string()),
    id: z.string(),
    npm: z.string().optional(),
    models: z.record(z.string(), Model),
  })

  export type Provider = z.infer<typeof Provider>

  function parseContextWindow(value: string): number {
    const str = value.toLowerCase().trim()
    const match = str.match(/^(\d+)([kkm]?b?)?$/)
    if (!match) return 128000

    const num = parseInt(match[1], 10)
    const suffix = match[2] || ""

    if (suffix === "k" || suffix === "kb") return num * 1000
    if (suffix === "m" || suffix === "mb") return num * 1000 * 1000
    return num
  }

  async function fromUserAPI(response: UserAPIResponse): Promise<Record<string, Provider>> {
    const result: Record<string, Provider> = {}

    const grouped = new Map<string, UserAPIModel[]>()

    for (const model of response.models) {
      if (!model.is_active) continue

      if (!grouped.has(model.provider)) {
        grouped.set(model.provider, [])
      }
      grouped.get(model.provider)!.push(model)
    }

    for (const [providerID, models] of grouped) {
      const firstModel = models[0]

      const modelsRecord: Record<string, Model> = {}
      for (const m of models) {
        const contextWindow = parseContextWindow(m.context_window)
        const releaseDate = m.created_at?.split("T")[0] || new Date().toISOString().split("T")[0]
        const family = m.model_id.split("-")[0]

        modelsRecord[m.model_id] = {
          id: m.model_id,
          name: m.name,
          family: family,
          release_date: releaseDate,
          attachment: false,
          reasoning: false,
          temperature: true,
          tool_call: true,
          interleaved: undefined,
          cost: {
            input: 0,
            output: 0,
            cache_read: 0,
            cache_write: 0,
          },
          limit: {
            context: contextWindow,
            input: undefined,
            output: contextWindow,
          },
          modalities: {
            input: ["text"],
            output: ["text"],
          },
          options: {},
          headers: {},
          provider: {
            npm: "@ai-sdk/openai-compatible",
          },
          variants: {},
        }
      }

      result[providerID] = {
        id: providerID,
        name: providerID,
        api: firstModel.api_base_url,
        npm: "@ai-sdk/openai-compatible",
        env: [],
        models: modelsRecord,
      }
    }

    return result
  }

  export async function get() {
    const response = await fetch(USER_API_URL, { signal: AbortSignal.timeout(10 * 1000) })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`)
    }

    const data: UserAPIResponse = await response.json()
    return fromUserAPI(data)
  }

  export async function refresh() {
    const file = Bun.file(filepath)

    const response = await fetch(USER_API_URL, { signal: AbortSignal.timeout(10 * 1000) })

    if (!response.ok) {
      throw new Error(`Failed to refresh models: ${response.status} ${response.statusText}`)
    }

    const data: UserAPIResponse = await response.json()
    const converted = await fromUserAPI(data)
    await Bun.write(file, JSON.stringify(converted, null, 2))
  }
}

setInterval(() => Models.refresh(), 60 * 1000 * 60).unref()
