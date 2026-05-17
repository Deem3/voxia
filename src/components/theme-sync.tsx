"use client"

import { useTheme } from "next-themes"
import { useLayoutEffect } from "react"

import { useSettingsStore } from "@/store/useSettingsStore"

/** After plugin-store rehydration, align `next-themes` with persisted `theme` (spec: store wins on boot). */
export const ThemeSync = () => {
  const hydrated = useSettingsStore((s) => s.hydrated)
  const theme = useSettingsStore((s) => s.theme)
  const { setTheme } = useTheme()

  useLayoutEffect(() => {
    if (!hydrated) return
    setTheme(theme)
  }, [hydrated, theme, setTheme])

  return null
}
