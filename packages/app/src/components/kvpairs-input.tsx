import { createSignal, For, Show } from "solid-js"
import { TextField } from "@opencode-ai/ui/text-field"
import { Button } from "@opencode-ai/ui/button"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Icon } from "@opencode-ai/ui/icon"

interface KvPair {
  id: string
  key: string
  value: string
}

interface KvPairsInputProps {
  label?: string
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
  placeholder?: { key: string; value: string }
}

export function KvPairsInput(props: KvPairsInputProps) {
  const [entries, setEntries] = createSignal<KvPair[]>([{ id: "1", key: "", value: "" }])

  const placeholder = props.placeholder ?? { key: "Key", value: "Value" }

  function addEntry() {
    const id = Date.now().toString()
    setEntries([...entries(), { id, key: "", value: "" }])
  }

  function removeEntry(id: string) {
    const newEntries = entries().filter((e) => e.id !== id)
    if (newEntries.length === 0) {
      setEntries([{ id: Date.now().toString(), key: "", value: "" }])
    } else {
      setEntries(newEntries)
    }
    notifyChange(newEntries)
  }

  function updateEntry(id: string, field: "key" | "value", value: string) {
    const newEntries = entries().map((e) => (e.id === id ? { ...e, [field]: value } : e))
    setEntries(newEntries)
    notifyChange(newEntries)
  }

  function notifyChange(currentEntries: KvPair[]) {
    const record = Object.fromEntries(currentEntries.filter((e) => e.key && e.value).map((e) => [e.key, e.value]))
    props.onChange(record)
  }

  return (
    <div class="flex flex-col gap-2">
      <Show when={props.label}>
        <label class="text-12-medium text-text-weak">{props.label}</label>
      </Show>
      <div class="flex flex-col gap-1.5">
        <For each={entries()}>
          {(entry) => (
            <div class="flex gap-1.5">
              <TextField
                placeholder={placeholder.key}
                value={entry.key}
                onChange={(v) => updateEntry(entry.id, "key", v)}
                class="flex-1 min-w-0"
                hideLabel
              />
              <TextField
                placeholder={placeholder.value}
                value={entry.value}
                onChange={(v) => updateEntry(entry.id, "value", v)}
                class="flex-1 min-w-0"
                hideLabel
              />
              <IconButton icon="close" variant="ghost" onClick={() => removeEntry(entry.id)} class="shrink-0" />
            </div>
          )}
        </For>
        <Button type="button" variant="ghost" onClick={addEntry} class="text-text-weak self-start">
          <Icon name="plus-small" />
          Add
        </Button>
      </div>
    </div>
  )
}
