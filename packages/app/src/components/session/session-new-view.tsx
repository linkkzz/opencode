import { Show, createMemo } from "solid-js"
import { DateTime } from "luxon"
import { useSync } from "@/context/sync"
import { Icon } from "@opencode-ai/ui/icon"
import { getDirectory, getFilename } from "@opencode-ai/util/path"

export function NewSessionView() {
  const sync = useSync()

  const projectRoot = createMemo(() => sync.data.path.directory)

  return (
    <div
      class="relative size-full flex flex-col pb-45 justify-end items-start gap-4 flex-[1_0_0] self-stretch max-w-200 mx-auto px-6"
      style={{ "padding-bottom": "calc(var(--prompt-height, 11.25rem) + 64px)" }}
    >
      <div class="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div class="relative z-10 flex flex-col gap-4">
        <div class="text-20-medium text-text-weaker">今天想聊点什么？</div>
        <div class="flex justify-center items-center gap-3">
          <Icon name="folder" size="small" />
          <div class="text-12-medium text-text-weak">
            {getDirectory(projectRoot())}
            <span class="text-text-strong">{getFilename(projectRoot())}</span>
          </div>
        </div>
        <Show when={sync.project}>
          {(project) => (
            <div class="flex justify-center items-center gap-3">
              <Icon name="pencil-line" size="small" />
              <div class="text-12-medium text-text-weak">
                Last modified&nbsp;
                <span class="text-text-strong">
                  {DateTime.fromMillis(project().time.updated ?? project().time.created).toRelative()}
                </span>
              </div>
            </div>
          )}
        </Show>
      </div>
    </div>
  )
}
