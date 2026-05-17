export const DEFAULT_CAPTION_MAX_WIDTH_PERCENT = 85

export const clampCaptionFontSizePx = (value: number) =>
  Math.min(72, Math.max(10, Math.round(Number(value)) || 10))

export const clampCaptionMaxWidthPercent = (value: number) =>
  Math.min(100, Math.max(25, Math.round(Number(value) * 10) / 10))
