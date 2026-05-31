"use client"

import { CaretDownIcon as CaretDown, CaretUpIcon as CaretUp, SlidersHorizontalIcon as Sliders } from "@phosphor-icons/react"
import { useState } from "react"

import { CaptionColorFields } from "@/features/editor/caption-color-fields"
import { CaptionFontFields } from "@/features/editor/caption-font-fields"
import { captionPositionSummary, type CaptionPosition } from "@/features/editor/caption-position"
import { Button } from "@/components/ui/button"
import type { CaptionColors } from "@/lib/caption-colors"
import { cn } from "@/lib/utils"

const colorSummary = (c: CaptionColors) =>
  `${c.textColor} / ${c.backgroundColor} ${Math.round(c.backgroundOpacity * 100)}%`

export type ProjectCaptionAppearanceBarProps = {
  displayFontSizePx: number
  displayFontFamily: string
  displayCaptionPosition: CaptionPosition
  displayCaptionColors: CaptionColors
  defaultFontSizePx: number
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

  return (
    <div className={cn(
      "border border-border/50 bg-card/20 transition-all duration-200",
      expanded && "bg-card/40",
    )}>
      {/* Toggle row */}
      <div className="flex min-w-0 flex-wrap items-center gap-2 px-3 py-1.5">
        <Button
          type="button"
          size="xs"
          variant={expanded ? "secondary" : "ghost"}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="caption-appearance-panel"
          className={cn(
            "gap-1.5 text-[0.6rem]",
            expanded ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Sliders className="size-3" weight="duotone" aria-hidden />
          Caption style
          {expanded
            ? <CaretUp className="size-2.5 opacity-60" weight="bold" aria-hidden />
            : <CaretDown className="size-2.5 opacity-60" weight="bold" aria-hidden />}
        </Button>

        {hasProjectOverride ? (
          <span
            className={cn(
              "inline-flex items-center px-1.5 py-0.5",
              "border border-signal/30 bg-signal-muted",
              "font-mono text-[0.55rem] uppercase tracking-wide text-signal",
              "animate-status-in",
            )}
            title="This project overrides global defaults"
          >
            Override
          </span>
        ) : null}

        {!expanded ? (
          <p className="min-w-0 flex-1 truncate font-mono text-[0.58rem] text-muted-foreground/50 select-none">
            {displayFontSizePx}px · {captionPositionSummary(displayCaptionPosition)} · {colorSummary(displayCaptionColors)}
          </p>
        ) : null}
      </div>

      {/* Expanded panel */}
      {expanded ? (
        <div
          id="caption-appearance-panel"
          role="region"
          aria-label="Caption style settings"
          className="space-y-4 border-t border-border/40 px-3 pb-4 pt-3 animate-fade-up"
        >
          <p className="text-[0.65rem] text-muted-foreground/70">
            <span className="font-medium text-foreground/70">Drag the caption block on the video</span> to set position.
            Changes here apply only to this project.
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
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={onResetToSettingsDefaults}
              className="text-muted-foreground hover:text-foreground"
            >
              Reset to Settings defaults
            </Button>
            <p className="text-[0.58rem] text-muted-foreground/50">
              Global: {defaultFontSizePx}px · {captionPositionSummary(defaultCaptionPosition)} · {colorSummary(defaultCaptionColors)}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
