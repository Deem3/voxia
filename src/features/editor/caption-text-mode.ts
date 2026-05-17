import type { Cue } from "@/types/voxia"

export type CaptionTextMode = "original" | "translated" | "bilingual"

export const CAPTION_TEXT_MODE_OPTIONS: {
  value: CaptionTextMode
  label: string
}[] = [
  { value: "original", label: "Transcribed" },
  { value: "translated", label: "Translated" },
  { value: "bilingual", label: "Both" },
]

export const captionPrimaryText = (cue: Cue, mode: CaptionTextMode): string => {
  if (mode === "translated") {
    const translated = cue.translatedText?.trim()
    if (translated) return translated
  }
  return cue.text?.trim() || "…"
}

export const captionSecondaryText = (cue: Cue, mode: CaptionTextMode): string | null => {
  if (mode !== "bilingual") return null
  const translated = cue.translatedText?.trim()
  return translated ? translated : null
}

export const showsTranslationInLists = (mode: CaptionTextMode): boolean =>
  mode === "bilingual" || mode === "translated"
