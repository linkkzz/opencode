import { createMemo, Show } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { useSync } from "@/context/sync"
import { DialogSelectMcp } from "@/components/dialog-select-mcp"

export function SessionMcpIndicator() {
  const sync = useSync()
  const dialog = useDialog()

  const mcpStats = createMemo(() => {
    const mcp = sync.data.mcp ?? {}
    const entries = Object.entries(mcp)
    const enabled = entries.filter(([, status]) => status.status === "connected").length
    const failed = entries.some(([, status]) => status.status === "failed")
    const total = entries.length
    return { enabled, failed, total }
  })

  const hasMcp = () => mcpStats().total > 0

  return (
    <Button variant="ghost" onClick={() => dialog.show(() => <DialogSelectMcp />)}>
      <Show when={hasMcp()}>
        <div
          classList={{
            "size-1.5 rounded-full mr-2": true,
            "bg-icon-critical-base": mcpStats().failed,
            "bg-icon-success-base": !mcpStats().failed && mcpStats().enabled > 0,
          }}
        />
      </Show>
      <span class="text-12-regular text-text-weak">{hasMcp() ? `${mcpStats().enabled} MCP` : "MCP"}</span>
    </Button>
  )
}
