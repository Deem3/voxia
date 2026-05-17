import { create } from "zustand"

type TranslationState = {
  provider: string
  sourceLang: string
  targetLang: string
  setProvider: (p: string) => void
  setSourceLang: (l: string) => void
  setTargetLang: (l: string) => void
}

export const useTranslationStore = create<TranslationState>((set) => ({
  provider: "nllb",
  sourceLang: "auto",
  targetLang: "mn",
  setProvider: (p) => set({ provider: p }),
  setSourceLang: (l) => set({ sourceLang: l }),
  setTargetLang: (l) => set({ targetLang: l }),
}))
