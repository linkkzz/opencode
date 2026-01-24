import { Component, createSignal, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { useSDK } from "@/context/sdk"
import { useSync } from "@/context/sync"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { TextField } from "@opencode-ai/ui/text-field"
import { Button } from "@opencode-ai/ui/button"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Icon } from "@opencode-ai/ui/icon"
import { Switch } from "@opencode-ai/ui/switch"
import { RadioGroup } from "@opencode-ai/ui/radio-group"
import { KvPairsInput } from "@/components/kvpairs-input"
import type { McpLocalConfig, McpRemoteConfig } from "@opencode-ai/sdk/v2/client"

export const DialogAddMcp: Component = () => {
  const sdk = useSDK()
  const sync = useSync()
  const dialog = useDialog()

  type McpType = "local" | "remote"

  const [mode, setMode] = createSignal<McpType>("remote")
  const [advancedOpen, setAdvancedOpen] = createSignal(false)
  const [submitting, setSubmitting] = createSignal(false)

  const [errors, setErrors] = createStore({
    name: "",
    command: "",
    url: "",
  })

  const [form, setForm] = createStore({
    name: "",
    local: {
      command: "",
      enabled: true,
      timeout: 5000,
      environment: {} as Record<string, string>,
    },
    remote: {
      url: "",
      enabled: true,
      timeout: 5000,
      headers: {} as Record<string, string>,
    },
  })

  function resetErrors() {
    setErrors({ name: "", command: "", url: "" })
  }

  function isDuplicateName(name: string): boolean {
    return Object.keys(sync.data.mcp ?? {}).includes(name)
  }

  function isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  function parseCommand(commandStr: string): string[] {
    return commandStr
      .trim()
      .split(/\s+/)
      .filter((s) => s.length > 0)
  }

  function validate(): boolean {
    resetErrors()
    let isValid = true

    if (!form.name.trim()) {
      setErrors("name", "MCP名称不能为空")
      isValid = false
    } else if (isDuplicateName(form.name.trim())) {
      setErrors("name", "MCP名称已存在")
      isValid = false
    }

    if (mode() === "local") {
      if (!form.local.command.trim()) {
        setErrors("command", "Command不能为空")
        isValid = false
      }
    } else {
      if (!form.remote.url.trim()) {
        setErrors("url", "URL不能为空")
        isValid = false
      } else if (!isValidUrl(form.remote.url.trim())) {
        setErrors("url", "URL格式无效")
        isValid = false
      }
    }

    return isValid
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!validate()) return
    if (submitting()) return

    setSubmitting(true)
    resetErrors()

    try {
      const name = form.name.trim()
      let config: McpLocalConfig | McpRemoteConfig

      if (mode() === "local") {
        config = {
          type: "local",
          command: parseCommand(form.local.command),
          enabled: form.local.enabled,
          timeout: form.local.timeout,
          environment: form.local.environment,
        } as McpLocalConfig
      } else {
        config = {
          type: "remote",
          url: form.remote.url.trim(),
          enabled: form.remote.enabled,
          timeout: form.remote.timeout,
          headers: form.remote.headers,
        } as McpRemoteConfig
      }

      await sdk.client.mcp.add({ name, config })

      const result = await sdk.client.mcp.status()
      if (result.data) sync.set("mcp", result.data)

      dialog.close()
    } catch (error) {
      console.error("Failed to add MCP:", error)
      const errorMsg = error instanceof Error ? error.message : "添加MCP失败"
      if (mode() === "local") {
        setErrors("command", errorMsg)
      } else {
        setErrors("url", errorMsg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog title="添加MCP">
      <form onSubmit={handleSubmit} class="flex flex-col gap-6 px-2.5 pb-3">
        <div class="flex flex-col gap-4">
          <TextField
            label="MCP名称"
            value={form.name}
            onChange={(v) => setForm("name", v)}
            error={errors.name}
            placeholder="feishu-docs"
            autofocus
          />

          <RadioGroup
            options={["remote", "local"] as McpType[]}
            current={mode()}
            onSelect={(v) => v && setMode(v)}
            value={(v) => v}
            label={(v) => (v === "local" ? "Local" : "Remote")}
          />

          <Show when={mode() === "local"}>
            <TextField
              label="Command"
              value={form.local.command}
              onChange={(v) => setForm("local", "command", v)}
              error={errors.command}
              placeholder="npx @modelcontextprotocol/server-filesystem /path"
            />
          </Show>

          <Show when={mode() === "remote"}>
            <TextField
              label="URL"
              value={form.remote.url}
              onChange={(v) => setForm("remote", "url", v)}
              error={errors.url}
              placeholder="http://localhost:8000/mcp"
            />
          </Show>
        </div>

        <div class="flex items-center justify-between py-2 border-t border-border-weak-base mt-2">
          <span class="text-14-medium text-text-base">高级配置</span>
          <Switch checked={advancedOpen()} onChange={setAdvancedOpen} />
        </div>

        <Show when={advancedOpen()}>
          <div class="flex flex-col gap-4">
            <TextField
              label="Timeout (ms)"
              type="text"
              value={String(mode() === "local" ? form.local.timeout : form.remote.timeout)}
              onChange={(v) => {
                const num = parseInt(v) || 5000
                if (mode() === "local") {
                  setForm("local", "timeout", num)
                } else {
                  setForm("remote", "timeout", num)
                }
              }}
              placeholder="5000"
            />

            <Show when={mode() === "local"}>
              <KvPairsInput
                label="Environment"
                value={form.local.environment}
                onChange={(v) => setForm("local", "environment", v)}
                placeholder={{ key: "API_KEY", value: "xxx" }}
              />
            </Show>

            <Show when={mode() === "remote"}>
              <KvPairsInput
                label="Headers"
                value={form.remote.headers}
                onChange={(v) => setForm("remote", "headers", v)}
                placeholder={{ key: "Authorization", value: "Bearer xxx" }}
              />
            </Show>
          </div>
        </Show>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => dialog.close()} disabled={submitting()}>
            取消
          </Button>
          <Button type="submit" variant="primary" disabled={submitting()}>
            {submitting() ? "添加中..." : "添加"}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
