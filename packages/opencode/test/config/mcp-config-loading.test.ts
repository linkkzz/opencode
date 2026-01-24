import { describe, test, expect, beforeAll } from "bun:test"
import { Config } from "../../src/config/config"
import { Instance } from "../../src/project/instance"
import fs from "fs/promises"
import path from "path"

describe("MCP Config Loading", () => {
  const testDir = "/tmp/opencode-mcp-test"
  const globalConfigPath = path.join(testDir, "opencode.json")
  const projectConfigPath = path.join(testDir, ".opencode", "opencode.jsonc")

  beforeAll(async () => {
    await fs.mkdir(path.join(testDir, ".opencode"), { recursive: true })

    await fs.writeFile(
      globalConfigPath,
      JSON.stringify(
        {
          $schema: "https://opencode.ai/config.json",
          mcp: {
            "global-mcp": { type: "local", command: ["echo", "global"] },
          },
        },
        null,
        2,
      ),
    )

    await fs.writeFile(
      projectConfigPath,
      JSON.stringify({
        $schema: "https://opencode.ai/config.json",
        mcp: {
          "project-mcp": { type: "local", command: ["echo", "project"] },
        },
      }),
    )
  })

  test("should only load MCP from global config", async () => {
    const mcpNames = Object.keys((await Config.get()).mcp ?? {})

    expect(mcpNames).toContain("global-mcp")
    expect(mcpNames).not.toContain("project-mcp")
  })
})
