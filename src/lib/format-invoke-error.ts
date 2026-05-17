/** Turn Tauri / IPC rejections into a single user-facing string. */
export const formatInvokeError = (e: unknown): string => {
  if (e === null || e === undefined) {
    return "Unknown error"
  }
  if (typeof e === "string") {
    return e
  }
  if (e instanceof Error) {
    return e.message.trim() || e.name || "Error"
  }
  if (typeof e === "object") {
    const o = e as Record<string, unknown>
    if (typeof o.message === "string" && o.message.trim() !== "") {
      return o.message
    }
    if (typeof o.error === "string" && o.error.trim() !== "") {
      return o.error
    }
    if (typeof o.kind === "string" && typeof o.message === "string") {
      return `${o.kind}: ${o.message}`
    }
    try {
      const s = JSON.stringify(e)
      if (s !== "{}") {
        return s
      }
    } catch {
      /* ignore */
    }
  }
  const s = String(e)
  return s === "[object Object]" ? "Request failed (no details from host)" : s
}
