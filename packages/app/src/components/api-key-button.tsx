import { createMemo, Show } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { useGlobalSync } from "@/context/global-sync"
import { DialogConnectProvider } from "./dialog-connect-provider"

interface ApiKeyButtonProps {
  directory?: string
}

export function ApiKeyButton(props: ApiKeyButtonProps) {
  const globalSync = useGlobalSync()
  const dialog = useDialog()

  const isConfigured = createMemo(() => {
    const connected = globalSync.data.provider?.connected ?? []
    const savedAuth = globalSync.data.provider_auth_saved?.["xiaomi-sc-cloud"] as
      | { type?: string; key?: string }
      | undefined
    return (
      connected.includes("xiaomi-sc-cloud") || (savedAuth?.type === "api" && savedAuth.key && savedAuth.key.length > 0)
    )
  })

  function handleManageApiKey() {
    dialog.show(() => <DialogConnectProvider provider="xiaomi-sc-cloud" directory={props.directory} />)
  }

  return (
    <Button variant="ghost" onClick={handleManageApiKey}>
      <Show when={isConfigured()}>
        <div class="size-1.5 rounded-full bg-icon-success-base mr-2" />
      </Show>
      <span class="text-12-regular text-text-weak">API KEY</span>
    </Button>
  )
}
