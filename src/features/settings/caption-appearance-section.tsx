"use client"

import { useMemo, useRef } from "react"

import { CaptionColorFields } from "@/features/editor/caption-color-fields"
import { CaptionOverlay } from "@/features/editor/caption-overlay"
import {
  CAPTION_TEXT_MODE_OPTIONS,
  type CaptionTextMode,
} from "@/features/editor/caption-text-mode"
import { DEFAULT_CAPTION_MAX_WIDTH_PERCENT } from "@/features/editor/caption-size"
import { CaptionFontFields } from "@/features/editor/caption-font-fields"
import type { CaptionColors } from "@/lib/caption-colors"
import { useSettingsStore } from "@/store/useSettingsStore"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

export const CaptionAppearanceSection = () => {
  const hydrated = useSettingsStore((s) => s.hydrated)
  const captionFontSizePx = useSettingsStore((s) => s.captionFontSizePx)
  const captionFontFamily = useSettingsStore((s) => s.captionFontFamily)
  const captionPositionXPercent = useSettingsStore((s) => s.captionPositionXPercent)
  const captionPositionYPercent = useSettingsStore((s) => s.captionPositionYPercent)
  const setCaptionFontSizePx = useSettingsStore((s) => s.setCaptionFontSizePx)
  const setCaptionFontFamily = useSettingsStore((s) => s.setCaptionFontFamily)
  const setCaptionPosition = useSettingsStore((s) => s.setCaptionPosition)
  const captionTextColor = useSettingsStore((s) => s.captionTextColor)
  const captionBackgroundColor = useSettingsStore((s) => s.captionBackgroundColor)
  const captionBackgroundOpacity = useSettingsStore((s) => s.captionBackgroundOpacity)
  const captionTextMode = useSettingsStore((s) => s.captionTextMode)
  const setCaptionTextMode = useSettingsStore((s) => s.setCaptionTextMode)
  const setCaptionTextColor = useSettingsStore((s) => s.setCaptionTextColor)
  const setCaptionBackgroundColor = useSettingsStore((s) => s.setCaptionBackgroundColor)
  const setCaptionBackgroundOpacity = useSettingsStore((s) => s.setCaptionBackgroundOpacity)
  const boundsRef = useRef<HTMLDivElement>(null)

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Loading caption settings…</p>
  }

  const position = { xPercent: captionPositionXPercent, yPercent: captionPositionYPercent }

  const captionColors: CaptionColors = useMemo(
    () => ({
      textColor: captionTextColor,
      backgroundColor: captionBackgroundColor,
      backgroundOpacity: captionBackgroundOpacity,
    }),
    [captionTextColor, captionBackgroundColor, captionBackgroundOpacity],
  )

  const handlePositionX = (v: number[]) => {
    const n = v[0]
    if (n === undefined) return
    setCaptionPosition({ xPercent: n, yPercent: captionPositionYPercent })
  }

  const handlePositionY = (v: number[]) => {
    const n = v[0]
    if (n === undefined) return
    setCaptionPosition({ xPercent: captionPositionXPercent, yPercent: n })
  }

  return (
    <section className="space-y-4" aria-labelledby="captions-heading">
      <h2 id="captions-heading" className="text-lg font-medium text-foreground">
        Caption overlay
      </h2>
      <p className="text-sm text-muted-foreground">
        Defaults for typography and where captions sit on the video in the editor. Drag the preview block or use the
        sliders; per-project overrides can still be set in the editor.
      </p>
      <CaptionFontFields
        idPrefix="settings"
        fontSizePx={captionFontSizePx}
        fontFamily={captionFontFamily}
        onFontSizeChange={setCaptionFontSizePx}
        onFontFamilyChange={setCaptionFontFamily}
      />
      <label className="grid max-w-xs gap-1 text-xs">
        <span className="font-medium text-foreground">Default caption text</span>
        <select
          className="h-9 border border-input bg-background px-2 font-mono text-xs"
          value={captionTextMode}
          onChange={(e) => setCaptionTextMode(e.target.value as CaptionTextMode)}
          aria-label="Default caption text on video"
        >
          {CAPTION_TEXT_MODE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-muted-foreground">
          Transcribed, translated, or both lines on the video overlay.
        </span>
      </label>
      <CaptionColorFields
        idPrefix="settings"
        colors={captionColors}
        onTextColorChange={setCaptionTextColor}
        onBackgroundColorChange={setCaptionBackgroundColor}
        onBackgroundOpacityChange={setCaptionBackgroundOpacity}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="settings-caption-x" className="text-xs">
            Horizontal position ({Math.round(captionPositionXPercent)}%)
          </Label>
          <Slider
            id="settings-caption-x"
            value={[captionPositionXPercent]}
            min={5}
            max={95}
            step={1}
            onValueChange={handlePositionX}
            aria-label="Caption horizontal position percent"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-caption-y" className="text-xs">
            Vertical position ({Math.round(captionPositionYPercent)}%)
          </Label>
          <Slider
            id="settings-caption-y"
            value={[captionPositionYPercent]}
            min={5}
            max={95}
            step={1}
            onValueChange={handlePositionY}
            aria-label="Caption vertical position percent"
          />
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Live preview</p>
        <div
          ref={boundsRef}
          className="relative aspect-video max-h-48 w-full max-w-md overflow-hidden border border-border bg-black"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black" aria-hidden />
          <CaptionOverlay
            cues={[]}
            currentTimeMs={0}
            textMode={captionTextMode}
            fontSizePx={captionFontSizePx}
            maxWidthPercent={DEFAULT_CAPTION_MAX_WIDTH_PERCENT}
            fontFamily={captionFontFamily}
            position={position}
            colors={captionColors}
            boundsRef={boundsRef}
            draggable
            onPositionChange={setCaptionPosition}
          />
        </div>
      </div>
    </section>
  )
}
