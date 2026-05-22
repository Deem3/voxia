import { useEffect } from "react"

import { useSettingsStore } from "@/store/useSettingsStore"
import { useTranslationStore } from "@/store/useTranslationStore"

/**
 * Sync persisted translation defaults from settings into the live translation store.
 * Runs once after settings hydration, and again whenever the persisted defaults change.
 */
export const useTranslationDefaultsSync = () => {
  const hydrated = useSettingsStore((s) => s.hydrated)
  const defaultProvider = useSettingsStore((s) => s.defaultTranslatorProvider)
  const defaultSourceLang = useSettingsStore((s) => s.defaultSourceLang)
  const defaultTargetLang = useSettingsStore((s) => s.defaultTargetLang)

  const setProvider = useTranslationStore((s) => s.setProvider)
  const setSourceLang = useTranslationStore((s) => s.setSourceLang)
  const setTargetLang = useTranslationStore((s) => s.setTargetLang)

  useEffect(() => {
    if (!hydrated) return
    setProvider(defaultProvider)
    setSourceLang(defaultSourceLang)
    setTargetLang(defaultTargetLang)
  }, [
    hydrated,
    defaultProvider,
    defaultSourceLang,
    defaultTargetLang,
    setProvider,
    setSourceLang,
    setTargetLang,
  ])
}
