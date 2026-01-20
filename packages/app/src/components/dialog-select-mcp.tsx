import { Component, createMemo, createSignal, Show } from "solid-js"
import { useSync } from "@/context/sync"
import { useSDK } from "@/context/sdk"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog as DialogComponent } from "@opencode-ai/ui/dialog"
import { List } from "@opencode-ai/ui/list"
import { Switch } from "@opencode-ai/ui/switch"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { DialogAddMcp } from "@/components/dialog-add-mcp"

export const DialogSelectMcp: Component = () => {
  const sync = useSync()
  const sdk = useSDK()
  const dialog = useDialog()
  const [loading, setLoading] = createSignal<string | null>(null)
  const [showAdd, setShowAdd] = createSignal(false)

  const items = createMemo(() =>
    Object.entries(sync.data.mcp ?? {})
      .map(([name, status]) => ({ name, status: status.status }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  )

  const toggle = async (name: string) => {
    if (loading()) return
    setLoading(name)
    const status = sync.data.mcp[name]
    if (status?.status === "connected") {
      await sdk.client.mcp.disconnect({ name })
    } else {
      await sdk.client.mcp.connect({ name })
    }
    const result = await sdk.client.mcp.status()
    if (result.data) sync.set("mcp", result.data)
    setLoading(null)
  }

  const enabledCount = createMemo(() => items().filter((i) => i.status === "connected").length)
  const totalCount = createMemo(() => items().length)

  return (
    <DialogComponent title="MCP管理" description={`${enabledCount()}/${totalCount()} 已启用`}>
      <List
        search={{ placeholder: "搜索", autofocus: true }}
        emptyMessage="未配置MCP"
        key={(x) => x?.name ?? ""}
        items={items}
        filterKeys={["name", "status"]}
        sortBy={(a, b) => a.name.localeCompare(b.name)}
        onSelect={(x) => {
          if (x) toggle(x.name)
        }}
      >
        {(i) => {
          const mcpStatus = () => sync.data.mcp[i.name]
          const status = () => mcpStatus()?.status
          const error = () => {
            const s = mcpStatus()
            return s?.status === "failed" ? s.error : undefined
          }
          const enabled = () => status() === "connected"
          return (
            <div class="w-full flex items-center justify-between gap-x-3">
              <div class="flex flex-col gap-0.5 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="truncate">{i.name}</span>
                  <Show when={status() === "connected"}>
                    <span class="text-11-regular text-text-weaker">已连接</span>
                  </Show>
                  <Show when={status() === "failed"}>
                    <span class="text-11-regular text-text-weaker">连接失败</span>
                  </Show>
                  <Show when={status() === "needs_auth"}>
                    <span class="text-11-regular text-text-weaker">需要认证</span>
                  </Show>
                  <Show when={status() === "disabled"}>
                    <span class="text-11-regular text-text-weaker">已禁用</span>
                  </Show>
                  <Show when={loading() === i.name}>
                    <span class="text-11-regular text-text-weak">...</span>
                  </Show>
                </div>
                <Show when={error()}>
                  <span class="text-11-regular text-text-weaker truncate">{error()}</span>
                </Show>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Switch checked={enabled()} disabled={loading() === i.name} onChange={() => toggle(i.name)} />
              </div>
            </div>
          )
        }}
      </List>
      <div class="flex justify-center py-4 border-t border-border-weak-base mt-4">
        <Button variant="secondary" onClick={() => setShowAdd(true)} class="gap-2">
          <Icon name="plus-small" />
          添加MCP
        </Button>
      </div>
      <Show when={showAdd()}>
        <DialogAddMcp />
      </Show>
    </DialogComponent>
  )
}
