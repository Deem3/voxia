import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification"

import { formatInvokeError } from "@/lib/format-invoke-error"

let permissionPromise: Promise<boolean> | null = null

export const ensureNotificationPermission = async (): Promise<boolean> => {
  if (permissionPromise) return permissionPromise
  permissionPromise = (async () => {
    try {
      let granted = await isPermissionGranted()
      if (!granted) {
        const result = await requestPermission()
        granted = result === "granted"
      }
      return granted
    } catch {
      return false
    }
  })()
  return permissionPromise
}

export type NotifyOptions = {
  title: string
  body?: string
}

export const notify = async ({ title, body }: NotifyOptions): Promise<void> => {
  const granted = await ensureNotificationPermission()
  if (!granted) return
  try {
    await sendNotification({ title, body })
  } catch {
    // Desktop permission denied or unsupported environment
  }
}

export const notifyTaskStarted = (title: string, body?: string) =>
  notify({ title, body })

export const notifyTaskSucceeded = (title: string, body?: string) =>
  notify({ title, body })

export const notifyTaskFailed = (title: string, body?: string) =>
  notify({ title, body: body ?? "See the app for details." })

export const formatNotifyError = formatInvokeError
