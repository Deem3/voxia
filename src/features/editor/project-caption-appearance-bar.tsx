"use client"

import { CaretDownIcon as CaretDown, CaretUpIcon as CaretUp, TextAaIcon as TextAa } from "@phosphor-icons/react"
import { useState } from "react"

import { CaptionColorFields } from "@/features/editor/caption-color-fields"
import { CaptionFontFields } from "@/features/editor/caption-font-fields"
import { captionPositionSummary, type CaptionPosition } from "@/features/editor/caption-position"
import { Button } from "@/components/ui/button"
import type { CaptionColors } from "@/lib/caption-colors"

const captionColorsSummary = (c: CaptionColors) =>
  `${c.textColor} on ${c.backgroundColor} · ${Math.round(c.backgroundOpacity * 100)}% fill`

export type ProjectCaptionAppearanceBarProps = {
  /** Values shown in controls (override ?? settings default) */
  displayFontSizePx: number
  displayFontFamily: string
  displayCaptionPosition: CaptionPosition
  displayCaptionColors: CaptionColors
  defaultFontSizePx: number
  defaultFontFamily: string
  defaultCaptionPosition: CaptionPosition
  defaultCaptionColors: CaptionColors
  hasProjectOverride: boolean
  onFontSizeChange: (n: number) => void
  onFontFamilyChange: (s: string) => void
  onCaptionTextColorChange: (hex: string) => void
  onCaptionBackgroundColorChange: (hex: string) => void
  onCaptionBackgroundOpacityChange: (opacity01: number) => void
  onResetToSettingsDefaults: () => void
}

export const ProjectCaptionAppearanceBar = ({
  displayFontSizePx,
  displayFontFamily,
  displayCaptionPosition,
  displayCaptionColors,
  defaultFontSizePx,
  defaultFontFamily,
  defaultCaptionPosition,
  defaultCaptionColors,
  hasProjectOverride,
  onFontSizeChange,
  onFontFamilyChange,
  onCaptionTextColorChange,
  onCaptionBackgroundColorChange,
  onCaptionBackgroundOpacityChange,
  onResetToSettingsDefaults,
}: ProjectCaptionAppearanceBarProps) => {
  const [expanded, setExpanded] = useState(false)

  const handleToggleExpanded = () => {
    setExpanded((v) => !v)
  }

  return (
    <div className="border border-border bg-card/40">
      <div className="flex min-w-0 flex-wrap items-center gap-2 p-2">
        <Button
          type="button"
          size="sm"
          variant={expanded ? "default" : "outline"}
          onClick={handleToggleExpanded}
          aria-expanded={expanded}
          aria-controls="project-caption-appearance-panel"
          id="project-caption-appearance-toggle"
          className="gap-1.5"
        >
          <TextAa className="size-4" weight="duotone" aria-hidden />
          <span className="hidden sm:inline">Caption look</span>
          <span className="sm:hidden">Captions</span>
          {expanded ? (
            <CaretUp className="size-3.5 opacity-70" weight="bold" aria-hidden />
          ) : (
            <CaretDown className="size-3.5 opacity-70" weight="bold" aria-hidden />
          )}
        </Button>
        {hasProjectOverride ? (
          <span
            className="inline-flex items-center border border-signal/40 bg-signal-muted px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wide text-signal"
            title="This project overrides the global defaults"
          >
            Project override
          </span>
        ) : null}
        {!expanded ? (
          <p className="min-w-0 flex-1 truncate text-[0.65rem] text-muted-foreground">
            {displayFontSizePx}px · {captionPositionSummary(displayCaptionPosition)} ·{" "}
            {captionColorsSummary(displayCaptionColors)}
          </p>
        ) : null}
      </div>
      {expanded ? (
        <div
          id="project-caption-appearance-panel"
          role="region"
          aria-labelledby="project-caption-appearance-toggle"
          className="space-y-3 border-t border-border px-3 pb-3 pt-2"
        >
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">Using project values; defaults from Settings.</span>{" "}
            {hasProjectOverride
              ? "Reset removes overrides for this project."
              : "Changes here apply only to this project."}{" "}
            <span className="font-medium text-foreground/80">Drag the caption on the video</span> to set position.
          </p>
          <CaptionFontFields
            idPrefix="editor-project"
            fontSizePx={displayFontSizePx}
            fontFamily={displayFontFamily}
            onFontSizeChange={onFontSizeChange}
            onFontFamilyChange={onFontFamilyChange}
          />
          <CaptionColorFields
            idPrefix="editor-project"
            colors={displayCaptionColors}
            onTextColorChange={onCaptionTextColorChange}
            onBackgroundColorChange={onCaptionBackgroundColorChange}
            onBackgroundOpacityChange={onCaptionBackgroundOpacityChange}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onResetToSettingsDefaults}>
              Reset to Settings defaults
            </Button>
            <p className="text-[0.65rem] text-muted-foreground">
              Global defaults: {defaultFontSizePx}px · {captionPositionSummary(defaultCaptionPosition)} ·{" "}
              {captionColorsSummary(defaultCaptionColors)} ·{" "}
              <span className="font-mono">{defaultFontFamily.slice(0, 36)}</span>
              {defaultFontFamily.length > 36 ? "…" : ""}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
