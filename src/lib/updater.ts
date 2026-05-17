import { check, type Update } from "@tauri-apps/plugin-updater"
import { relaunch } from "@tauri-apps/plugin-process"

export type UpdateCheckResult =
  | { status: "unavailable" }
  | { status: "current" }
  | { status: "available"; update: Update; version: string }
  | { status: "error"; message: string }

const formatUpdaterError = (error: unknown): string => {
  if (error instanceof Error) {
    const msg = error.message
    if (/network|fetch|connect/i.test(msg)) {
      return "Could not reach the update server. Check your connection."
    }
    if (/signature|sign/i.test(msg)) {
      return "Update signature verification failed."
    }
    return msg
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
