import { load } from "@tauri-apps/plugin-store"
import { create } from "zustand"

import {
  captionPositionFromLegacyVerticalAlign,
  clampCaptionPosition,
  DEFAULT_CAPTION_POSITION,
  type CaptionPosition,
} from "@/features/editor/caption-position"
import type { CaptionTextMode } from "@/features/editor/caption-text-mode"
import {
  clampCaptionBackgroundOpacity,
  DEFAULT_CAPTION_BACKGROUND_COLOR,
  DEFAULT_CAPTION_BACKGROUND_OPACITY,
  DEFAULT_CAPTION_TEXT_COLOR,
  normalizeHexColor,
} from "@/lib/caption-colors"

const parseCaptionTextMode = (value: unknown): CaptionTextMode => {
  if (value === "translated" || value === "bilingual") return value
  return "original"
}

export type Theme = "light" | "dark" | "system"

const SETTINGS_FILE = "settings.json"

type SettingsState = {
  theme: Theme
  defaultTranslatorProvider: string
  defaultSourceLang: string
  defaultTargetLang: string
  modelsDirOverride: string | null
  recentProjectPaths: string[]
  captionFontSizePx: number
  captionFontFamily: string
  captionPositionXPercent: number
  captionPositionYPercent: number
  captionTextColor: string
  captionBackgroundColor: string
  captionBackgroundOpacity: number
  captionTextMode: CaptionTextMode
  hydrated: boolean
  hydrate: () => Promise<void>
  persist: () => Promise<void>
  setTheme: (t: Theme) => void
  setDefaultTranslatorProvider: (id: string) => void
  setDefaultSourceLang: (l: string) => void
  setDefaultTargetLang: (l: string) => void
  setModelsDirOverride: (p: string | null) => void
  setCaptionFontSizePx: (n: number) => void
  setCaptionFontFamily: (s: string) => void
  setCaptionPosition: (p: CaptionPosition) => void
  setCaptionTextColor: (s: string) => void
  setCaptionBackgroundColor: (s: string) => void
  setCaptionBackgroundOpacity: (n: number) => void
  setCaptionTextMode: (mode: CaptionTextMode) => void
  addRecentProject: (projectPath: string) => void
  removeRecentProject: (projectPath: string) => void
}

const RECENT_CAP = 40

const defaults = {
  theme: "system" as Theme,
  defaultTranslatorProvider: "google",
  defaultSourceLang: "auto",
  defaultTargetLang: "mn",
  modelsDirOverride: null as string | null,
  recentProjectPaths: [] as string[],
  captionFontSizePx: 20,
  captionFontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
  captionPositionXPercent: DEFAULT_CAPTION_POSITION.xPercent,
  captionPositionYPercent: DEFAULT_CAPTION_POSITION.yPercent,
  captionTextColor: DEFAULT_CAPTION_TEXT_COLOR,
  captionBackgroundColor: DEFAULT_CAPTION_BACKGROUND_COLOR,
  captionBackgroundOpacity: DEFAULT_CAPTION_BACKGROUND_OPACITY,
  captionTextMode: "original" as CaptionTextMode,
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaults,
  hydrated: false,
  hydrate: async () => {
    const store = await load(SETTINGS_FILE, { defaults: {}, autoSave: false })
    const theme = (await store.get<Theme>("theme")) ?? defaults.theme
    const storedProvider = await store.get<string>("defaultTranslatorProvider")
    const defaultTranslatorProvider =
      storedProvider === "google_free"
        ? "google"
        : (storedProvider ?? defaults.defaultTranslatorProvider)
    const defaultSourceLang =
      (await store.get<string>("defaultSourceLang")) ?? defaults.defaultSourceLang
    const defaultTargetLang =
      (await store.get<string>("defaultTargetLang")) ?? defaults.defaultTargetLang
    const modelsDirOverride =
      (await store.get<string | null>("modelsDirOverride")) ?? defaults.modelsDirOverride
    const recentProjectPaths =
      (await store.get<string[]>("recentProjectPaths")) ?? defaults.recentProjectPaths
    const captionFontSizePxRaw = await store.get<number>("captionFontSizePx")
    const captionFontSizePx =
      typeof captionFontSizePxRaw === "number" && Number.isFinite(captionFontSizePxRaw)
        ? Math.min(72, Math.max(10, Math.round(captionFontSizePxRaw)))
        : defaults.captionFontSizePx
    const captionFontFamily =
      (await store.get<string>("captionFontFamily")) ?? defaults.captionFontFamily

    const xRaw = await store.get<number>("captionPositionXPercent")
    const yRaw = await store.get<number>("captionPositionYPercent")
    let captionPosition = clampCaptionPosition(
      typeof xRaw === "number" && Number.isFinite(xRaw) ? xRaw : DEFAULT_CAPTION_POSITION.xPercent,
      typeof yRaw === "number" && Number.isFinite(yRaw) ? yRaw : DEFAULT_CAPTION_POSITION.yPercent,
    )
    const hasNewPosition =
      typeof xRaw === "number" &&
      Number.isFinite(xRaw) &&
      typeof yRaw === "number" &&
      Number.isFinite(yRaw)
    if (!hasNewPosition) {
      const legacyAlign = await store.get<string>("captionVerticalAlign")
      captionPosition = captionPositionFromLegacyVerticalAlign(legacyAlign)
    }

    const textColorRaw = await store.get<string>("captionTextColor")
    const captionTextColor =
      typeof textColorRaw === "string" && textColorRaw.trim() !== ""
        ? normalizeHexColor(textColorRaw, DEFAULT_CAPTION_TEXT_COLOR)
        : DEFAULT_CAPTION_TEXT_COLOR
    const bgColorRaw = await store.get<string>("captionBackgroundColor")
    const captionBackgroundColor =
      typeof bgColorRaw === "string" && bgColorRaw.trim() !== ""
        ? normalizeHexColor(bgColorRaw, DEFAULT_CAPTION_BACKGROUND_COLOR)
        : DEFAULT_CAPTION_BACKGROUND_COLOR
    const bgOpRaw = await store.get<number>("captionBackgroundOpacity")
    const captionBackgroundOpacity =
      typeof bgOpRaw === "number" && Number.isFinite(bgOpRaw)
        ? clampCaptionBackgroundOpacity(bgOpRaw)
        : DEFAULT_CAPTION_BACKGROUND_OPACITY
    const captionTextMode = parseCaptionTextMode(await store.get("captionTextMode"))

    set({
      theme,
      defaultTranslatorProvider,
      defaultSourceLang,
      defaultTargetLang,
      modelsDirOverride,
      recentProjectPaths: Array.isArray(recentProjectPaths) ? recentProjectPaths : [],
      captionFontSizePx,
      captionFontFamily,
      captionPositionXPercent: captionPosition.xPercent,
      captionPositionYPercent: captionPosition.yPercent,
      captionTextColor,
      captionBackgroundColor,
      captionBackgroundOpacity,
      captionTextMode,
      hydrated: true,
    })
  },
  persist: async () => {
    const s = get()
    const store = await load(SETTINGS_FILE, { defaults: {}, autoSave: false })
    await store.set("theme", s.theme)
    await store.set("defaultTranslatorProvider", s.defaultTranslatorProvider)
    await store.set("defaultSourceLang", s.defaultSourceLang)
    await store.set("defaultTargetLang", s.defaultTargetLang)
    await store.set("modelsDirOverride", s.modelsDirOverride)
    await store.set("recentProjectPaths", s.recentProjectPaths)
    await store.set("captionFontSizePx", s.captionFontSizePx)
    await store.set("captionFontFamily", s.captionFontFamily)
    await store.set("captionPositionXPercent", s.captionPositionXPercent)
    await store.set("captionPositionYPercent", s.captionPositionYPercent)
    await store.set("captionTextColor", s.captionTextColor)
    await store.set("captionBackgroundColor", s.captionBackgroundColor)
    await store.set("captionBackgroundOpacity", s.captionBackgroundOpacity)
    await store.set("captionTextMode", s.captionTextMode)
    await store.save()
  },
  setTheme: (t) => {
    set({ theme: t })
    void get().persist()
  },
  setDefaultTranslatorProvider: (id) => {
    set({ defaultTranslatorProvider: id })
    void get().persist()
  },
  setDefaultSourceLang: (l) => {
    set({ defaultSourceLang: l })
    void get().persist()
  },
  setDefaultTargetLang: (l) => {
    set({ defaultTargetLang: l })
    void get().persist()
  },
  setModelsDirOverride: (p) => {
    set({ modelsDirOverride: p })
    void get().persist()
  },
  setCaptionFontSizePx: (n) => {
    const v = Math.min(72, Math.max(10, Math.round(Number(n)) || defaults.captionFontSizePx))
    set({ captionFontSizePx: v })
    void get().persist()
  },
  setCaptionFontFamily: (s) => {
    const t = s.trim() === "" ? defaults.captionFontFamily : s.trim()
    set({ captionFontFamily: t })
    void get().persist()
  },
  setCaptionPosition: (p) => {
    const c = clampCaptionPosition(p.xPercent, p.yPercent)
    set({ captionPositionXPercent: c.xPercent, captionPositionYPercent: c.yPercent })
    void get().persist()
  },
  setCaptionTextColor: (s) => {
    const t = normalizeHexColor(s, defaults.captionTextColor)
    set({ captionTextColor: t })
    void get().persist()
  },
  setCaptionBackgroundColor: (s) => {
    const t = normalizeHexColor(s, defaults.captionBackgroundColor)
    set({ captionBackgroundColor: t })
    void get().persist()
  },
  setCaptionBackgroundOpacity: (n) => {
    set({ captionBackgroundOpacity: clampCaptionBackgroundOpacity(Number(n)) })
    void get().persist()
  },
  setCaptionTextMode: (mode) => {
    set({ captionTextMode: parseCaptionTextMode(mode) })
    void get().persist()
  },
  addRecentProject: (projectPath) => {
    const cur = get().recentProjectPaths.filter((p) => p !== projectPath)
    const next = [projectPath, ...cur].slice(0, RECENT_CAP)
    set({ recentProjectPaths: next })
    void get().persist()
  },
  removeRecentProject: (projectPath) => {
    set({ recentProjectPaths: get().recentProjectPaths.filter((p) => p !== projectPath) })
    void get().persist()
  },
}))
