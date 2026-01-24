import { Button } from "@opencode-ai/ui/button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { createMemo, createSignal, Show } from "solid-js"

type DialogConfirmProps = {
  title?: string
  description?: string
  icon?: "error" | "warning" | "info"
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  variant?: "danger" | "primary" | "default"
  loading?: boolean
}

export function DialogConfirm(props: DialogConfirmProps) {
  const dialog = useDialog()
  const [localLoading, setLocalLoading] = createSignal(false)
  const isLoading = () => props.loading ?? localLoading()
  const isDanger = () => props.variant === "danger"

  const icon = createMemo(() => {
    switch (props.icon) {
      case "error":
        return "circle-ban-sign" as const
      case "warning":
        return "bubble-5" as const
      case "info":
        return "bubble-5" as const
      default:
        return null
    }
  })

  const iconColor = createMemo(() => {
    switch (props.icon) {
      case "error":
      case "warning":
        return "text-icon-warning-strong"
      case "info":
        return "text-icon-interactive-base"
      default:
        return null
    }
  })

  async function handleConfirm() {
    if (isLoading()) return
    if (props.loading === undefined) setLocalLoading(true)
    try {
      await Promise.resolve(props.onConfirm())
    } catch (error) {
      console.error("[DialogConfirm] Error in onConfirm:", error)
    } finally {
      if (props.loading === undefined) setLocalLoading(false)
    }
    dialog.close()
  }

  return (
    <Dialog title={props.title}>
      <div class="flex flex-col gap-4 px-2.5 pb-3">
        <Show when={props.icon}>
          <div class="flex items-start gap-3">
            <Show when={icon()}>
              {(iconName) => (
                <div class="shrink-0 pt-0.5">
                  <Icon
                    name={iconName()}
                    size="small"
                    classList={{
                      [iconColor() ?? ""]: true,
                    }}
                  />
                </div>
              )}
            </Show>
            <div class="flex-1">
              <Show when={props.description}>
                {(desc) => <div class="text-14-regular text-text-base">{desc()}</div>}
              </Show>
            </div>
          </div>
        </Show>
        <Show when={props.description && !props.icon}>
          {(desc) => <div class="text-14-regular text-text-base">{desc()}</div>}
        </Show>

        <div class="flex justify-end gap-2">
          <Button variant="ghost" size="large" onClick={() => dialog.close()}>
            {props.cancelLabel ?? "取消"}
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={async (e: MouseEvent) => {
              e.stopPropagation()
              e.preventDefault()
              try {
                await handleConfirm()
              } catch (err) {
                console.error("[DialogConfirm] Error calling handleConfirm:", err)
              }
            }}
            disabled={isLoading()}
            classList={{
              "bg-text-critical-base hover:bg-icon-critical-base active:bg-icon-critical-base text-background-base":
                isDanger(),
            }}
          >
            <Show when={isLoading()} fallback={props.confirmLabel ?? "确定"}>
              <span class="flex items-center gap-2">
                <Spinner class="size-4" />
                删除中...
              </span>
            </Show>
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
