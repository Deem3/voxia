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
import { cn } from "@/lib/utils"

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

  // useMemo must be called before any conditional return (Rules of Hooks)
  const captionColors: CaptionColors = useMemo(
    () => ({
      textColor: captionTextColor,
      backgroundColor: captionBackgroundColor,
      backgroundOpacity: captionBackgroundOpacity,
    }),
    [captionTextColor, captionBackgroundColor, captionBackgroundOpacity],
  )

  if (!hydrated) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-muted/20 shimmer" />
        ))}
      </div>
    )
  }

  const position = { xPercent: captionPositionXPercent, yPercent: captionPositionYPercent }

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
    <section className="space-y-5" aria-labelledby="captions-heading">
      <h3 id="captions-heading" className="sr-only">Caption overlay</h3>

      <CaptionFontFields
        idPrefix="settings"
        fontSizePx={captionFontSizePx}
        fontFamily={captionFontFamily}
        onFontSizeChange={setCaptionFontSizePx}
        onFontFamilyChange={setCaptionFontFamily}
      />

      {/* Caption text mode */}
      <div className="grid gap-1.5">
        <label
          htmlFor="settings-caption-mode"
          className="text-xs font-semibold text-foreground/80"
        >
          Default caption display
        </label>
        <select
          id="settings-caption-mode"
          className={cn(
            "h-8 max-w-xs border border-input bg-background/80 px-2",
            "font-mono text-xs text-foreground",
            "transition-colors hover:border-signal/40 focus:border-signal focus:outline-none",
          )}
          value={captionTextMode}
          onChange={(e) => setCaptionTextMode(e.target.value as CaptionTextMode)}
          aria-label="Caption text on video"
        >
          {CAPTION_TEXT_MODE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-[0.65rem] text-muted-foreground/60">
          Transcribed, translated, or both on the video overlay.
        </p>
      </div>

      <CaptionColorFields
        idPrefix="settings"
        colors={captionColors}
        onTextColorChange={setCaptionTextColor}
        onBackgroundColorChange={setCaptionBackgroundColor}
        onBackgroundOpacityChange={setCaptionBackgroundOpacity}
      />

      {/* Position sliders */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="settings-caption-x" className="text-xs">
            Horizontal <span className="font-mono text-signal/70">{Math.round(captionPositionXPercent)}%</span>
          </Label>
          <Slider
            id="settings-caption-x"
            value={[captionPositionXPercent]}
            min={5}
            max={95}
            step={1}
            onValueChange={handlePositionX}
            aria-label="Caption horizontal position"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-caption-y" className="text-xs">
            Vertical <span className="font-mono text-signal/70">{Math.round(captionPositionYPercent)}%</span>
          </Label>
          <Slider
            id="settings-caption-y"
            value={[captionPositionYPercent]}
            min={5}
            max={95}
            step={1}
            onValueChange={handlePositionY}
            aria-label="Caption vertical position"
          />
        </div>
      </div>

      {/* Preview */}
      <div>
        <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
          Preview
        </p>
        <div
          ref={boundsRef}
          className="relative aspect-video max-h-40 w-full max-w-sm overflow-hidden border border-border/50 bg-black"
        >
          <div
            className="absolute inset-0 bg-gradient-to-br from-zinc-800/80 to-black"
            aria-hidden
          />
          {/* Scanline effect */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 1px, rgba(255,255,255,0.5) 1px, rgba(255,255,255,0.5) 2px)",
              backgroundSize: "100% 3px",
            }}
            aria-hidden
          />
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
        <p className="mt-1.5 text-[0.6rem] text-muted-foreground/50">
          Drag the caption block to adjust position.
        </p>
      </div>
    </section>
  )
}
