import type { ProviderAuthAuthorization } from "@opencode-ai/sdk/v2/client"
import { createOpencodeClient } from "@opencode-ai/sdk/v2/client"
import { Button } from "@opencode-ai/ui/button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import type { IconName } from "@opencode-ai/ui/icons/provider"
import { List, type ListRef } from "@opencode-ai/ui/list"
import { ProviderIcon } from "@opencode-ai/ui/provider-icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { TextField } from "@opencode-ai/ui/text-field"
import { showToast } from "@opencode-ai/ui/toast"
import { iife } from "@opencode-ai/util/iife"
import { createMemo, Match, onCleanup, onMount, Show, Switch } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { Link } from "@/components/link"
import { useGlobalSDK } from "@/context/global-sdk"
import { useGlobalSync } from "@/context/global-sync"
import { usePlatform } from "@/context/platform"
import { DialogSelectModel } from "./dialog-select-model"
import { DialogSelectProvider } from "./dialog-select-provider"

export function DialogConnectProvider(props: { provider: string; directory?: string }) {
  const dialog = useDialog()
  const globalSync = useGlobalSync()
  const globalSDK = useGlobalSDK()
  const platform = usePlatform()
  const setGlobalStore = globalSync.setStore

  console.log(
    `[DEBUG DialogConnectProvider] Initialized with provider: ${props.provider}, directory: ${props.directory || "global"}`,
  )

  const directorySDK = createMemo(() => {
    if (!props.directory) {
      console.log(`[DEBUG DialogConnectProvider] No directory provided, using global SDK`)
      return null
    }
    console.log(`[DEBUG DialogConnectProvider] Creating directory SDK for: ${props.directory}`)
    return createOpencodeClient({
      baseUrl: globalSDK.url,
      fetch: platform.fetch,
      directory: props.directory,
      throwOnError: true,
    })
  })

  const sdk = createMemo(() => {
    const dirSdk = directorySDK()
    console.log(`[DEBUG DialogConnectProvider] SDK selection:`, dirSdk ? "directory" : "global")
    return dirSdk ?? globalSDK.client
  })
  const provider = createMemo(() => {
    const p = globalSync.data.provider.all.find((x) => x.id === props.provider)!
    console.log(`[DEBUG FRONTEND] Provider info:`, p)
    return p
  })
  const methods = createMemo(() => {
    const m = globalSync.data.provider_auth[props.provider] ?? [
      {
        type: "api",
        label: "API key",
      },
    ]
    console.log(`[DEBUG FRONTEND] Methods for ${props.provider}:`, m)
    return m
  })
  const [store, setStore] = createStore({
    methodIndex: undefined as undefined | number,
    authorization: undefined as undefined | ProviderAuthAuthorization,
    state: "pending" as undefined | "pending" | "complete" | "error",
    error: undefined as string | undefined,
  })

  const method = createMemo(() => {
    const m = store.methodIndex !== undefined ? methods().at(store.methodIndex!) : undefined
    console.log(`[DEBUG FRONTEND] Current method:`, m)
    console.log(`[DEBUG FRONTEND] methodIndex: ${store.methodIndex}, methods: ${methods().length}`)
    return m
  })

  const isConfigured = createMemo(() => {
    const connected = globalSync.data.provider?.connected ?? []
    const isConnected = connected.includes(props.provider)

    console.log(`[DEBUG FRONTEND isConfigured] Provider: ${props.provider}`)
    console.log(`[DEBUG FRONTEND isConfigured] In connected list:`, isConnected)
    console.log(`[DEBUG FRONTEND isConfigured] Connected providers:`, connected)

    console.log(`[DEBUG FRONTEND isConfigured] Result: ${isConnected}`)
    return isConnected
  })

  async function selectMethod(index: number) {
    const method = methods()[index]
    setStore(
      produce((draft) => {
        draft.methodIndex = index
        draft.authorization = undefined
        draft.state = undefined
        draft.error = undefined
      }),
    )

    if (method.type === "oauth") {
      setStore("state", "pending")
      const start = Date.now()
      await globalSDK.client.provider.oauth
        .authorize(
          {
            providerID: props.provider,
            method: index,
          },
          { throwOnError: true },
        )
        .then((x) => {
          const elapsed = Date.now() - start
          const delay = 1000 - elapsed

          if (delay > 0) {
            setTimeout(() => {
              setStore("state", "complete")
              setStore("authorization", x.data!)
            }, delay)
            return
          }
          setStore("state", "complete")
          setStore("authorization", x.data!)
        })
        .catch((e) => {
          setStore("state", "error")
          setStore("error", String(e))
        })
    }
  }

  let listRef: ListRef | undefined

  const savedAuth = createMemo(() => {
    const auth = globalSync.data.provider_auth_saved?.[props.provider] as { type?: string; key?: string } | undefined
    const value = auth?.type === "api" && auth?.key && auth.key.length > 0 ? auth.key : ""
    return value
  }, undefined)

  const [formStore, setFormStore] = createStore({
    value: savedAuth(),
    hasChanged: false,
    error: undefined as string | undefined,
  })

  const isSaveDisabled = createMemo(() => {
    const isEmpty = !formStore.value || formStore.value.trim().length === 0
    return isEmpty
  })

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!formStore.hasChanged) return

    const trimmedKey = formStore.value.trim()
    setFormStore("error", undefined)

    console.log(`[DEBUG handleSubmit] Form submitted`)
    console.log(`[DEBUG handleSubmit] Provider: ${props.provider}`)
    console.log(`[DEBUG handleSubmit] Directory: ${props.directory || "not provided"}`)
    console.log(`[DEBUG handleSubmit] API Key length: ${trimmedKey.length}`)
    console.log(`[DEBUG handleSubmit] SDK URL: ${globalSDK.url}`)

    const currentSDK = sdk()
    console.log(`[DEBUG handleSubmit] Using SDK:`, currentSDK === globalSDK.client ? "global" : "directory")
    console.log(`[DEBUG handleSubmit] Client exists:`, !!currentSDK)
    console.log(`[DEBUG handleSubmit] Client type:`, typeof currentSDK)

    console.log(`[DEBUG handleSubmit] Client.auth exists:`, !!currentSDK?.auth)
    console.log(`[DEBUG handleSubmit] Client.auth.set exists:`, typeof currentSDK?.auth?.set)
    console.log(`[DEBUG handleSubmit] Client.auth:`, currentSDK?.auth)

    try {
      const params: any = {
        providerID: props.provider,
        auth: {
          type: "api",
          key: trimmedKey,
        },
      }

      if (props.directory) {
        params.directory = props.directory
        console.log(`[DEBUG handleSubmit] Including directory in auth.set: ${props.directory}`)
      }

      console.log(`[DEBUG handleSubmit] Calling auth.set...`)
      console.log(`[DEBUG handleSubmit] Parameters:`, {
        ...params,
        auth: {
          ...params.auth,
          key: "***" + trimmedKey.substring(trimmedKey.length - 4),
        },
      })

      const result = await currentSDK.auth.set(params)

      console.log(`[DEBUG handleSubmit] auth.set succeeded!`)
      console.log(`[DEBUG handleSubmit] Result:`, result)
      console.log(`[DEBUG handleSubmit] Response data:`, result.data)

      if (!formStore.error) {
        await complete()
      }
    } catch (error) {
      console.error(`[DEBUG handleSubmit] auth.set FAILED!`)
      console.error(`[DEBUG handleSubmit] Error:`, error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      const errorName = error instanceof Error ? error.constructor.name : typeof error
      console.error(`[DEBUG handleSubmit] Error type: ${errorName}`)
      console.error(`[DEBUG handleSubmit] Error message:`, errorMsg)

      const errorMessage = `保存失败: ${errorMsg || "未知错误"}`
      setFormStore("error", errorMessage)
    }
  }

  function handleValueChange(newValue: string) {
    setFormStore("value", newValue)
    setFormStore("hasChanged", true)
  }

  function handleKey(e: KeyboardEvent) {
    if (store.methodIndex !== undefined) return
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      return
    }
    if (e.key === "Escape") return
    listRef?.onKeyDown(e)
  }

  onMount(() => {
    console.log(`[DEBUG FRONTEND onMount] Methods length: ${methods().length}`)
    if (methods().length === 1) {
      console.log(`[DEBUG FRONTEND onMount] Auto-selecting method 0, not adding keyboard listener`)
      selectMethod(0)
    } else {
      console.log(`[DEBUG FRONTEND onMount] Not auto-selecting, adding keyboard listener`)
      document.addEventListener("keydown", handleKey)
    }
    onCleanup(() => {
      document.removeEventListener("keydown", handleKey)
    })
  })

  async function complete() {
    console.log(`[DEBUG FRONTEND] Starting complete() for provider: ${props.provider}`)

    await globalSDK.client.global.dispose()

    console.log(`[DEBUG FRONTEND] Disposed global SDK, closing dialog`)
    dialog.close()
    showToast({
      variant: "success",
      icon: "circle-check",
      title: `${provider().name} connected`,
      description: `${provider().name} models are now available to use.`,
    })
    console.log(`[DEBUG FRONTEND] Dialog closed and toast shown`)
  }

  function goBack() {
    if (methods().length === 1) {
      dialog.show(() => <DialogSelectProvider />)
      return
    }
    if (store.authorization) {
      setStore("authorization", undefined)
      setStore("methodIndex", undefined)
      return
    }
    if (store.methodIndex) {
      setStore("methodIndex", undefined)
      return
    }
    dialog.show(() => <DialogSelectProvider />)
  }

  return (
    <Dialog
      title={
        <Switch>
          <Match when={props.provider === "xiaomi-sc-cloud"}>API Key 配置</Match>
          <Match when={true}>
            <IconButton tabIndex={-1} icon="arrow-left" variant="ghost" onClick={goBack} />
          </Match>
        </Switch>
      }
      {...(props.provider === "xiaomi-sc-cloud" ? { "xiaomi-sc-cloud-dialog": true } : {})}
    >
      <div class="flex flex-col gap-4 px-2.5">
        <Show when={props.provider !== "xiaomi-sc-cloud"}>
          <div class="px-2.5 flex gap-4 items-center">
            <ProviderIcon id={props.provider as IconName} class="size-5 shrink-0 icon-strong-base" />
            <div class="text-16-medium text-text-strong">
              <Switch>
                <Match when={props.provider === "anthropic" && method()?.label?.toLowerCase().includes("max")}>
                  Login with Claude Pro/Max
                </Match>
                <Match when={true}>Connect {provider().name}</Match>
              </Switch>
            </div>
          </div>
        </Show>
        <div class="px-2.5 flex flex-col gap-6">
          <Switch>
            <Match when={store.methodIndex === undefined}>
              <div class="text-14-regular text-text-base">Select login method for {provider().name}.</div>
              <div class="">
                <List
                  ref={(ref) => {
                    listRef = ref
                  }}
                  items={methods}
                  key={(m) => m?.label}
                  onSelect={async (method, index) => {
                    if (!method) return
                    selectMethod(index)
                  }}
                >
                  {(i) => (
                    <div class="w-full flex items-center gap-x-2">
                      <div class="w-4 h-2 rounded-[1px] bg-input-base shadow-xs-border-base flex items-center justify-center">
                        <div class="w-2.5 h-0.5 bg-icon-strong-base hidden" data-slot="list-item-extra-icon" />
                      </div>
                      <span>{i.label}</span>
                    </div>
                  )}
                </List>
              </div>
            </Match>
            <Match when={store.state === "pending"}>
              <div class="text-14-regular text-text-base">
                <div class="flex items-center gap-x-2">
                  <Spinner />
                  <span>Authorization in progress...</span>
                </div>
              </div>
            </Match>
            <Match when={store.state === "error"}>
              <div class="text-14-regular text-text-base">
                <div class="flex items-center gap-x-2">
                  <Icon name="circle-ban-sign" class="text-icon-critical-base" />
                  <span>Authorization failed: {store.error}</span>
                </div>
              </div>
            </Match>
            <Match when={method()?.type === "api"}>
              <form onSubmit={handleSubmit} class="flex flex-col gap-6">
                <div class="rounded-lg border border-border-weak-base bg-surface-info-base/10 p-4">
                  <div class="flex items-start gap-3">
                    <Icon name="check" class="size-5 text-icon-base mt-0.5 flex-shrink-0" />
                    <div class="flex flex-col gap-2">
                      <div class="text-14-medium text-text-base">
                        <Switch>
                          <Match when={props.provider === "xiaomi-sc-cloud"}>配置 API Key</Match>
                          <Match when={true}>Connect with API Key</Match>
                        </Switch>
                      </div>
                      <div class="text-13-regular text-text-weak leading-relaxed">
                        <Switch>
                          <Match when={props.provider === "xiaomi-sc-cloud"}>
                            登录{" "}
                            <Link href="https://cloudmodel.iccc.mioffice.cn/" tabIndex={-1}>
                              CloudModel平台
                            </Link>{" "}
                            创建 API Key 并填入下方。
                          </Match>
                          <Match when={true}>
                            Enter your {provider().name} API key to connect your account and use models in OpenCode.
                          </Match>
                        </Switch>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="w-full flex gap-2 items-start">
                  <TextField
                    autofocus
                    type="text"
                    placeholder="API Key"
                    name="apiKey"
                    value={formStore.value}
                    onChange={handleValueChange}
                    validationState={formStore.error ? "invalid" : undefined}
                    error={formStore.error}
                    class="flex-1"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSaveDisabled()}
                    class="h-[32px] px-4 whitespace-nowrap"
                  >
                    {isConfigured() ? "更新" : "保存"}
                  </Button>
                </div>
                <div class="text-12-regular text-text-weak">[DEBUG] isSaveDisabled: {String(isSaveDisabled())}</div>
              </form>
            </Match>
            <Match when={method()?.type === "oauth"}>
              <Switch>
                <Match when={store.authorization?.method === "code"}>
                  {iife(() => {
                    const [formStore, setFormStore] = createStore({
                      value: "",
                      error: undefined as string | undefined,
                    })

                    onMount(() => {
                      if (store.authorization?.method === "code" && store.authorization?.url) {
                        platform.openLink(store.authorization.url)
                      }
                    })

                    async function handleSubmit(e: SubmitEvent) {
                      e.preventDefault()

                      const form = e.currentTarget as HTMLFormElement
                      const formData = new FormData(form)
                      const code = formData.get("code") as string

                      if (!code?.trim()) {
                        setFormStore("error", "Authorization code is required")
                        return
                      }

                      setFormStore("error", undefined)
                      const { error } = await globalSDK.client.provider.oauth.callback({
                        providerID: props.provider,
                        method: store.methodIndex,
                        code,
                      })
                      if (!error) {
                        await complete()
                        return
                      }
                      setFormStore("error", "Invalid authorization code")
                    }

                    return (
                      <div class="flex flex-col gap-6">
                        <div class="text-14-regular text-text-base">
                          Visit <Link href={store.authorization!.url}>this link</Link> to collect your authorization
                          code to connect your account and use {provider().name} models in OpenCode.
                        </div>
                        <form onSubmit={handleSubmit} class="flex flex-col items-start gap-4">
                          <TextField
                            autofocus
                            type="text"
                            label={`${method()?.label} authorization code`}
                            placeholder="Authorization code"
                            name="code"
                            value={formStore.value}
                            onChange={setFormStore.bind(null, "value")}
                            validationState={formStore.error ? "invalid" : undefined}
                            error={formStore.error}
                          />
                          <Button class="w-auto" type="submit" size="large" variant="primary">
                            Submit
                          </Button>
                        </form>
                      </div>
                    )
                  })}
                </Match>
                <Match when={store.authorization?.method === "auto"}>
                  {iife(() => {
                    const code = createMemo(() => {
                      const instructions = store.authorization?.instructions
                      if (instructions?.includes(":")) {
                        return instructions?.split(":")[1]?.trim()
                      }
                      return instructions
                    })

                    onMount(async () => {
                      const result = await globalSDK.client.provider.oauth.callback({
                        providerID: props.provider,
                        method: store.methodIndex,
                      })
                      if (result.error) {
                        // TODO: show error
                        dialog.close()
                        return
                      }
                      await complete()
                    })

                    return (
                      <div class="flex flex-col gap-6">
                        <div class="text-14-regular text-text-base">
                          Visit <Link href={store.authorization!.url}>this link</Link> and enter the code below to
                          connect your account and use {provider().name} models in OpenCode.
                        </div>
                        <TextField label="Confirmation code" class="font-mono" value={code()} readOnly copyable />
                        <div class="text-14-regular text-text-base flex items-center gap-4">
                          <Spinner />
                          <span>Waiting for authorization...</span>
                        </div>
                      </div>
                    )
                  })}
                </Match>
              </Switch>
            </Match>
          </Switch>
        </div>
      </div>
    </Dialog>
  )
}
