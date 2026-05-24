import { check, type Update } from "@tauri-apps/plugin-updater"
import { relaunch } from "@tauri-apps/plugin-process"

export type UpdateCheckResult =
  | { status: "unavailable" }
  | { status: "current" }
  | { status: "available"; update: Update; version: string }
  | { status: "error"; message: string }

const formatUpdaterError = (error: unknown): string => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : error && typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : ""

  if (message) {
    if (/404|not found/i.test(message)) {
      return "Update manifest not found. The app may be pointing at the wrong GitHub repository."
    }
    if (/network|fetch|connect|dns|timed out/i.test(message)) {
      return "Could not reach the update server. Check your connection."
    }
    if (/signature|sign/i.test(message)) {
      return "Update signature verification failed."
    }
    return message
  }

  return "An unknown error occurred while checking for updates."
}

export const checkForUpdates = async (): Promise<UpdateCheckResult> => {
  if (import.meta.env.DEV) {
    return {
      status: "error",
      message: "Updates are disabled in development builds.",
    }
  }

  try {
    const update = await check()
    if (!update) {
      return { status: "current" }
    }
    return { status: "available", update, version: update.version }
  } catch (error) {
    return { status: "error", message: formatUpdaterError(error) }
  }
}

export type InstallProgress = {
  phase: "started" | "progress" | "finished"
  downloaded?: number
  contentLength?: number
}

export const installUpdate = async (
  update: Update,
  onProgress?: (progress: InstallProgress) => void,
): Promise<{ ok: true } | { ok: false; message: string }> => {
  try {
    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          onProgress?.({
            phase: "started",
            contentLength: event.data.contentLength ?? undefined,
          })
          break
        case "Progress":
          onProgress?.({
            phase: "progress",
            downloaded: event.data.chunkLength,
          })
          break
        case "Finished":
          onProgress?.({ phase: "finished" })
          break
      }
    })
    await relaunch()
    return { ok: true }
  } catch (error) {
    return { ok: false, message: formatUpdaterError(error) }
  }
}
