import { useMemo } from "react"

import {
  hasProjectCaptionPositionOverride,
  resolveEffectiveCaptionPosition,
  type CaptionPosition,
} from "@/features/editor/caption-position"
import {
  clampCaptionMaxWidthPercent,
  DEFAULT_CAPTION_MAX_WIDTH_PERCENT,
} from "@/features/editor/caption-size"
import {
  hasProjectCaptionColorOverride,
  resolveEffectiveCaptionColors,
  type CaptionColors,
} from "@/lib/caption-colors"
import type { VoxiaProject } from "@/types/voxia"

const MIN_FONT_PX = 10
const MAX_FONT_PX = 72

const clampFontSizePx = (n: number) =>
  Math.min(MAX_FONT_PX, Math.max(MIN_FONT_PX, Math.round(n)))

export type CaptionControlDisplay = {
  fontSizePx: number
  fontFamily: string
  captionPosition: CaptionPosition
  captionColors: CaptionColors
  hasProjectOverride: boolean
}

export type EffectiveCaptionDisplay = {
  effectiveCaptionFontSizePx: number
  effectiveCaptionFontFamily: string
  effectiveCaptionMaxWidthPercent: number
  effectiveCaptionPosition: CaptionPosition
  effectiveCaptionColors: CaptionColors
  captionControlDisplay: CaptionControlDisplay
}

type Args = {
  project: VoxiaProject | null
  settingsCaptionFontSizePx: number
  settingsCaptionFontFamily: string
  settingsCaptionPosition: CaptionPosition
  settingsCaptionColors: CaptionColors
}

/**
 * Resolve effective caption display values by merging project overrides with global settings.
 * Returns both the values used for rendering and a control-display flag indicating overrides.
 */
export const useEffectiveCaptionDisplay = ({
  project,
  settingsCaptionFontSizePx,
  settingsCaptionFontFamily,
  settingsCaptionPosition,
  settingsCaptionColors,
}: Args): EffectiveCaptionDisplay =>
  useMemo(() => {
    if (!project) {
      return {
        effectiveCaptionFontSizePx: settingsCaptionFontSizePx,
        effectiveCaptionFontFamily: settingsCaptionFontFamily,
        effectiveCaptionMaxWidthPercent: DEFAULT_CAPTION_MAX_WIDTH_PERCENT,
        effectiveCaptionPosition: settingsCaptionPosition,
        effectiveCaptionColors: settingsCaptionColors,
        captionControlDisplay: {
          fontSizePx: settingsCaptionFontSizePx,
          fontFamily: settingsCaptionFontFamily,
          captionPosition: settingsCaptionPosition,
          captionColors: settingsCaptionColors,
          hasProjectOverride: false,
        },
      }
    }

    const rawSize = project.captionFontSizePx
    const rawWidth = project.captionMaxWidthPercent
    const rawFam = project.captionFontFamily

    const effectiveCaptionFontSizePx =
      rawSize != null && Number.isFinite(rawSize)
        ? clampFontSizePx(rawSize)
        : settingsCaptionFontSizePx

    const effectiveCaptionMaxWidthPercent =
      rawWidth != null && Number.isFinite(rawWidth)
        ? clampCaptionMaxWidthPercent(rawWidth)
        : DEFAULT_CAPTION_MAX_WIDTH_PERCENT

    const effectiveCaptionFontFamily =
      rawFam != null && rawFam.trim() !== ""
        ? rawFam.trim()
        : settingsCaptionFontFamily

    const effectiveCaptionPosition = resolveEffectiveCaptionPosition(
      project,
      settingsCaptionPosition,
    )
    const effectiveCaptionColors = resolveEffectiveCaptionColors(
      project,
      settingsCaptionColors,
    )

    const hasProjectOverride =
      (rawSize != null && Number.isFinite(rawSize)) ||
      (rawWidth != null && Number.isFinite(rawWidth)) ||
      (rawFam != null && rawFam.trim() !== "") ||
      hasProjectCaptionPositionOverride(project) ||
      hasProjectCaptionColorOverride(project)

    return {
      effectiveCaptionFontSizePx,
      effectiveCaptionFontFamily,
      effectiveCaptionMaxWidthPercent,
      effectiveCaptionPosition,
      effectiveCaptionColors,
      captionControlDisplay: {
        fontSizePx: effectiveCaptionFontSizePx,
        fontFamily: effectiveCaptionFontFamily,
        captionPosition: effectiveCaptionPosition,
        captionColors: effectiveCaptionColors,
        hasProjectOverride,
      },
    }
  }, [
    project,
    settingsCaptionFontSizePx,
    settingsCaptionFontFamily,
    settingsCaptionPosition,
    settingsCaptionColors,
  ])
