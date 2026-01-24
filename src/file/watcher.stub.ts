import { BusEvent } from "@/bus/bus-event"

const FileWatcher = {
  Event: {
    Updated: BusEvent.define("file.watcher.updated", { file: "string", event: z.enum(["add", "change", "unlink"]) }),
  },
}
