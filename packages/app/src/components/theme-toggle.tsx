import { createMemo } from "solid-js"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { useTheme, type ColorScheme } from "@opencode-ai/ui/theme"

export function ThemeToggle() {
  const theme = useTheme()

  const scheme = createMemo(() => theme.colorScheme())
  const mode = createMemo(() => theme.mode())

  const toggle = () => {
    const current = scheme()
    const next: ColorScheme = mode() === "dark" ? "light" : "dark"
    theme.setColorScheme(next)
  }

  const icon = createMemo(() => {
    return mode() === "dark" ? "sun" : "moon"
  })

  const tooltip = createMemo(() => {
    return mode() === "dark" ? "切换到浅色模式" : "切换到深色模式"
  })

  return (
    <Tooltip value={tooltip()}>
      <IconButton icon={icon()} variant="ghost" class="size-6 p-0" onClick={toggle} />
    </Tooltip>
  )
}
