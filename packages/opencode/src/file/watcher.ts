import { BusEvent } from "@/bus/bus-event"
import z from "zod"

export namespace FileWatcher {
  export const Event = {
    Updated: BusEvent.define(
      "file.watcher.updated",
      z.object({
        file: z.string(),
        event: z.union([z.literal("add"), z.literal("change"), z.literal("unlink")]),
      }),
    ),
  }
}
