/** Normalized caption anchor on the video (percent of container width/height). */

import type { VoxiaProject } from "@/types/voxia"

export type CaptionPosition = {
  xPercent: number
  yPercent: number
}

/** Default matches former “bottom” subtitle band (center-x, lower third). */
export const DEFAULT_CAPTION_POSITION: CaptionPosition = {
  xPercent: 50,
  yPercent: 88,
}

export const clampCaptionPosition = (xPercent: number, yPercent: number): CaptionPosition => {
  const clamp = (n: number) => Math.min(95, Math.max(5, Math.round(n * 10) / 10))
  return { xPercent: clamp(xPercent), yPercent: clamp(yPercent) }
}

/** Maps legacy Settings / project `captionVerticalAlign` strings to a drag position. */
export const captionPositionFromLegacyVerticalAlign = (
  raw: string | null | undefined,
): CaptionPosition => {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : ""
  if (v === "top") return { xPercent: 50, yPercent: 12 }
  if (v === "center") return { xPercent: 50, yPercent: 50 }
  return DEFAULT_CAPTION_POSITION
}

export const parseCaptionPositionPair = (
  x: number | null | undefined,
  y: number | null | undefined,
): CaptionPosition | null => {
  if (x == null || y == null || !Number.isFinite(x) || !Number.isFinite(y)) return null
  return clampCaptionPosition(x, y)
}

export const captionPositionSummary = (p: CaptionPosition): string =>
  `${p.xPercent}% × ${p.yPercent}%`

export const resolveEffectiveCaptionPosition = (
  project: VoxiaProject | null | undefined,
  settingsPosition: CaptionPosition,
): CaptionPosition => {
  if (!project) return settingsPosition
  const direct = parseCaptionPositionPair(project.captionPositionXPercent, project.captionPositionYPercent)
  if (direct) return direct
  if (project.captionVerticalAlign != null && String(project.captionVerticalAlign).trim() !== "") {
    return captionPositionFromLegacyVerticalAlign(String(project.captionVerticalAlign))
  }
  return settingsPosition
}

export const hasProjectCaptionPositionOverride = (project: VoxiaProject): boolean => {
  if (parseCaptionPositionPair(project.captionPositionXPercent, project.captionPositionYPercent)) {
    return true
  }
  if (project.captionVerticalAlign != null && String(project.captionVerticalAlign).trim() !== "") {
    return true
  }
  return false
}
