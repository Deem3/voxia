"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  clampCaptionBackgroundOpacity,
  normalizeHexColor,
  type CaptionColors,
} from "@/lib/caption-colors"

export type CaptionColorFieldsProps = {
  idPrefix: string
  colors: CaptionColors
  onTextColorChange: (hex: string) => void
  onBackgroundColorChange: (hex: string) => void
  onBackgroundOpacityChange: (opacity01: number) => void
}

export const CaptionColorFields = ({
  idPrefix,
  colors,
  onTextColorChange,
  onBackgroundColorChange,
  onBackgroundOpacityChange,
}: CaptionColorFieldsProps) => {
  const textId = `${idPrefix}-caption-text-color`
  const bgId = `${idPrefix}-caption-bg-color`
  const opId = `${idPrefix}-caption-bg-opacity`
  const textNorm = normalizeHexColor(colors.textColor, colors.textColor)
  const bgNorm = normalizeHexColor(colors.backgroundColor, colors.backgroundColor)
  const opacityPct = Math.round(clampCaptionBackgroundOpacity(colors.backgroundOpacity) * 100)

  const handleOpacitySlider = (v: number[]) => {
    const n = v[0]
    if (n === undefined) return
    onBackgroundOpacityChange(n / 100)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor={textId}>Text color</Label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={`${textId}-picker`}
            type="color"
            value={textNorm}
            onChange={(e) => onTextColorChange(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded-none border border-input bg-background p-0"
            aria-label="Text color picker"
          />
          <Input
            id={textId}
            value={colors.textColor}
            onChange={(e) => onTextColorChange(e.target.value)}
            spellCheck={false}
            className="min-w-[7rem] flex-1 font-mono text-xs"
            aria-describedby={`${textId}-hint`}
          />
        </div>
        <p id={`${textId}-hint`} className="text-xs text-muted-foreground">
          Hex such as <code className="text-foreground">#ffffff</code>.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={bgId}>Background color</Label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={`${bgId}-picker`}
            type="color"
            value={bgNorm}
            onChange={(e) => onBackgroundColorChange(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded-none border border-input bg-background p-0"
            aria-label="Background color picker"
          />
          <Input
            id={bgId}
            value={colors.backgroundColor}
            onChange={(e) => onBackgroundColorChange(e.target.value)}
            spellCheck={false}
            className="min-w-[7rem] flex-1 font-mono text-xs"
            aria-describedby={`${bgId}-hint`}
          />
        </div>
        <p id={`${bgId}-hint`} className="text-xs text-muted-foreground">
          Panel fill behind captions (combined with opacity below).
        </p>
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor={opId}>Background opacity ({opacityPct}%)</Label>
        <Slider
          id={opId}
          value={[opacityPct]}
          min={0}
          max={100}
          step={1}
          onValueChange={handleOpacitySlider}
          aria-label="Caption background opacity percent"
        />
      </div>
    </div>
  )
}
