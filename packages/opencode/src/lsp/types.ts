import { z } from "zod"

export namespace LSP {
  export const Range = z.object({
    start: z.object({
      line: z.number(),
      character: z.number(),
    }),
    end: z.object({
      line: z.number(),
      character: z.number(),
    }),
  })
  export type Range = z.infer<typeof Range>
}
