import { Dialog as Kobalte } from "@kobalte/core/dialog"
import { ComponentProps, JSXElement, Match, ParentProps, Show, Switch, splitProps } from "solid-js"
import { IconButton } from "./icon-button"

export interface DialogProps extends ParentProps {
  title?: JSXElement
  description?: JSXElement
  action?: JSXElement
  class?: ComponentProps<"div">["class"]
  classList?: ComponentProps<"div">["classList"]
}

export function Dialog(props: DialogProps) {
  const [local, others] = splitProps(props, ["title", "description", "action", "class", "classList", "children"])

  return (
    <div data-component="dialog" {...others}>
      <div data-slot="dialog-container">
        <Kobalte.Content
          data-slot="dialog-content"
          classList={{
            ...(local.classList ?? {}),
            [local.class ?? ""]: !!local.class,
          }}
          onOpenAutoFocus={(e) => {
            const target = e.currentTarget as HTMLElement | null
            const autofocusEl = target?.querySelector("[autofocus]") as HTMLElement | null
            if (autofocusEl) {
              e.preventDefault()
              setTimeout(() => autofocusEl.focus(), 0)
              return
            }
          }}
        >
          <Show when={local.title || local.action}>
            <div data-slot="dialog-header">
              <Show when={local.title}>
                <Kobalte.Title data-slot="dialog-title">{local.title}</Kobalte.Title>
              </Show>
              <Switch>
                <Match when={local.action}>{local.action}</Match>
                <Match when={true}>
                  <Kobalte.CloseButton data-slot="dialog-close-button" as={IconButton} icon="close" variant="ghost" />
                </Match>
              </Switch>
            </div>
          </Show>
          <Show when={local.description}>
            <Kobalte.Description data-slot="dialog-description">{local.description}</Kobalte.Description>
          </Show>
          <div data-slot="dialog-body">{local.children}</div>
        </Kobalte.Content>
      </div>
    </div>
  )
}
