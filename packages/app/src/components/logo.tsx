import { useTheme } from "@opencode-ai/ui/theme"

export function Logo() {
  const theme = useTheme()
  const isDark = () => theme.mode() === "dark"

  return (
    <a
      href="https://cloudmodel.iccc.mioffice.cn/"
      target="_blank"
      class="group flex items-center gap-2 cursor-default ml-4"
    >
      <div
        class="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg transition-transform group-hover:scale-105"
        style={isDark() ? { "background-color": "#FFFFFF" } : { "background-color": "#171717" }}
      >
        <div
          class="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
          style="background: linear-gradient(to top right, #3b82f6, #06b6d4)"
        />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          class="relative h-3.5 w-3.5"
          style={isDark() ? { color: "#171717" } : { color: "#FFFFFF" }}
        >
          <path
            d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="miter"
          />
          <path d="M12 12L12 21" stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter" />
          <path d="M12 12L20 7.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter" />
          <path d="M12 12L4 7.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      </div>
      <div class="flex flex-col">
        <span
          class="text-[10px] font-bold tracking-[0.075em] leading-none mb-1"
          style={isDark() ? { color: "#FFFFFF" } : { color: "#171717" }}
        >
          CloudModel
        </span>
        <span
          class="text-[7px] font-medium tracking-wider uppercase leading-none"
          style={isDark() ? { color: "#A3A3A3" } : { color: "#737373" }}
        >
          座舱云AI Platform
        </span>
      </div>
    </a>
  )
}
