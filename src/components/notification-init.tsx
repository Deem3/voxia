"use client"

import { useEffect } from "react"

import { ensureNotificationPermission } from "@/lib/notifications"

export const NotificationInit = () => {
  useEffect(() => {
    void ensureNotificationPermission()
  }, [])

  return null
}
