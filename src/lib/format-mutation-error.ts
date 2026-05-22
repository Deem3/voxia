import { formatInvokeError } from "@/lib/format-invoke-error"

/** Prefer a thrown `Error.message`, fall back to the invoke error formatter. */
export const formatMutationError = (e: unknown): string =>
  e instanceof Error && e.message.trim() !== ""
    ? e.message
    : formatInvokeError(e)
