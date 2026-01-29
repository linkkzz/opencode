import path from "path"
import { Global } from "../global"
import fs from "fs/promises"
import z from "zod"

export const OAUTH_DUMMY_KEY = "opencode-oauth-dummy-key"

export namespace Auth {
  export const Oauth = z
    .object({
      type: z.literal("oauth"),
      refresh: z.string(),
      access: z.string(),
      expires: z.number(),
      accountId: z.string().optional(),
      enterpriseUrl: z.string().optional(),
    })
    .meta({ ref: "OAuth" })

  export const Api = z
    .object({
      type: z.literal("api"),
      key: z.string(),
    })
    .meta({ ref: "ApiAuth" })

  export const WellKnown = z
    .object({
      type: z.literal("wellknown"),
      key: z.string(),
      token: z.string(),
    })
    .meta({ ref: "WellKnownAuth" })

  export const Info = z.discriminatedUnion("type", [Oauth, Api, WellKnown]).meta({ ref: "Auth" })
  export type Info = z.infer<typeof Info>

  const filepath = path.join(Global.Path.data, "auth.json")

  console.log(`[DEBUG AUTH] Auth file path: ${filepath}`)

  export async function get(providerID: string) {
    const auth = await all()
    return auth[providerID]
  }

  export async function all(): Promise<Record<string, Info>> {
    console.log(`[DEBUG AUTH] Reading auth from: ${filepath}`)
    const file = Bun.file(filepath)
    const data = await file.json().catch(() => {
      console.log(`[DEBUG AUTH] Auth file does not exist, returning empty object`)
      return {} as Record<string, unknown>
    })
    console.log(`[DEBUG AUTH] Raw data from file: ${JSON.stringify(data)}`)
    const result = Object.entries(data).reduce(
      (acc, [key, value]) => {
        const parsed = Info.safeParse(value)
        if (!parsed.success) return acc
        acc[key] = parsed.data
        return acc
      },
      {} as Record<string, Info>,
    )
    console.log(`[DEBUG AUTH] Parsed auth providers: ${Object.keys(result).join(", ") || "none"}`)
    return result
  }

  export async function set(key: string, info: Info) {
    console.log(`[DEBUG AUTH SET] Setting auth for provider: ${key}`)
    console.log(`[DEBUG AUTH SET] Auth info type: ${info.type}`)
    if (info.type === "api") {
      console.log(`[DEBUG AUTH SET] API key length: ${info.key.length}`)
      console.log(`[DEBUG AUTH SET] API key preview: ${info.key.substring(0, 8)}...`)
    }
    const file = Bun.file(filepath)
    const data = await all()
    const newData = { ...data, [key]: info }
    await Bun.write(file, JSON.stringify(newData, null, 2))
    console.log(`[DEBUG AUTH SET] Successfully wrote auth file`)
    if (process.platform !== "win32") {
      await fs.chmod(file.name!, 0o600)
      console.log(`[DEBUG AUTH SET] Set file permissions to 0o600`)
    }
    console.log(`[DEBUG AUTH SET] Verifying write by reading back...`)
    const verify = await Bun.file(filepath).text()
    console.log(`[DEBUG AUTH SET] File content length: ${verify.length}`)
    if (process.platform === "win32") {
      console.log(`[DEBUG AUTH SET] Platform is Windows, skipping chmod`)
    }
  }

  export async function remove(key: string) {
    console.log(`[DEBUG AUTH REMOVE] Removing auth for provider: ${key}`)
    const file = Bun.file(filepath)
    const data = await all()
    delete data[key]
    await Bun.write(file, JSON.stringify(data, null, 2))
    console.log(`[DEBUG AUTH REMOVE] Successfully removed auth`)
    if (process.platform !== "win32") {
      await fs.chmod(file.name!, 0o600)
    }
  }
}
