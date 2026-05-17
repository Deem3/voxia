import type { VoxiaProject } from "@/types/voxia"

export type CaptionColors = {
  textColor: string
  backgroundColor: string
  backgroundOpacity: number
}

export const DEFAULT_CAPTION_TEXT_COLOR = "#ffffff"
export const DEFAULT_CAPTION_BACKGROUND_COLOR = "#000000"
export const DEFAULT_CAPTION_BACKGROUND_OPACITY = 0.65

export const DEFAULT_CAPTION_COLORS: CaptionColors = {
  textColor: DEFAULT_CAPTION_TEXT_COLOR,
  backgroundColor: DEFAULT_CAPTION_BACKGROUND_COLOR,
  backgroundOpacity: DEFAULT_CAPTION_BACKGROUND_OPACITY,
}

/** Accepts #rgb or #rrggbb (optional leading #). */
export const normalizeHexColor = (raw: string, fallback: string): string => {
  const t = raw.trim()
  const m = t.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m?.[1]) return fallback
  let h = m[1].toLowerCase()
  if (h.length === 3) {
    h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
  }
  return `#${h}`
}

export const clampCaptionBackgroundOpacity = (n: number): number => {
  if (!Number.isFinite(n)) return DEFAULT_CAPTION_BACKGROUND_OPACITY
  return Math.min(1, Math.max(0, Math.round(n * 1000) / 1000))
}

const hexByte = (c: string, i: number) => parseInt(c.slice(i, i + 2), 16)

export const hexToRgba = (hex: string, alpha: number): string => {
  const h = normalizeHexColor(hex, DEFAULT_CAPTION_BACKGROUND_COLOR).slice(1)
  const r = hexByte(h, 0)
  const g = hexByte(h, 2)
  const b = hexByte(h, 4)
  const a = clampCaptionBackgroundOpacity(alpha)
  return `rgba(${r},${g},${b},${a})`
}

export const resolveEffectiveCaptionColors = (
  project: VoxiaProject | null | undefined,
  settings: CaptionColors,
): CaptionColors => {
  if (!project) return settings
  const textRaw = project.captionTextColor
  const textColor =
    textRaw != null && String(textRaw).trim() !== ""
      ? normalizeHexColor(String(textRaw), settings.textColor)
      : settings.textColor
  const bgRaw = project.captionBackgroundColor
  const backgroundColor =
    bgRaw != null && String(bgRaw).trim() !== ""
      ? normalizeHexColor(String(bgRaw), settings.backgroundColor)
      : settings.backgroundColor
  const opRaw = project.captionBackgroundOpacity
  const backgroundOpacity =
    opRaw != null && Number.isFinite(Number(opRaw))
      ? clampCaptionBackgroundOpacity(Number(opRaw))
      : settings.backgroundOpacity
  return { textColor, backgroundColor, backgroundOpacity }
}

export const hasProjectCaptionColorOverride = (project: VoxiaProject): boolean => {
  if (project.captionTextColor != null && String(project.captionTextColor).trim() !== "") return true
  if (project.captionBackgroundColor != null && String(project.captionBackgroundColor).trim() !== "") return true
  if (project.captionBackgroundOpacity != null && Number.isFinite(Number(project.captionBackgroundOpacity))) {
    return true
  }
  return false
}
