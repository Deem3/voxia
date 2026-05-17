"use client"

import { CAPTION_FONT_PRESETS } from "@/features/editor/caption-overlay"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type CaptionFontFieldsProps = {
  idPrefix: string
  fontSizePx: number
  fontFamily: string
  onFontSizeChange: (n: number) => void
  onFontFamilyChange: (s: string) => void
}

export const CaptionFontFields = ({
  idPrefix,
  fontSizePx,
  fontFamily,
  onFontSizeChange,
  onFontFamilyChange,
}: CaptionFontFieldsProps) => {
  const sizeId = `${idPrefix}-caption-size`
  const presetId = `${idPrefix}-caption-preset`
  const familyId = `${idPrefix}-caption-family`
  const presetValue = CAPTION_FONT_PRESETS.some((p) => p.value === fontFamily)
    ? fontFamily
    : "__custom__"

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor={sizeId}>Font size (px)</Label>
        <Input
          id={sizeId}
          type="number"
          min={10}
          max={72}
          step={1}
          value={fontSizePx}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          className="font-mono text-xs"
          aria-describedby={`${sizeId}-hint`}
        />
        <p id={`${sizeId}-hint`} className="text-xs text-muted-foreground">
          Clamped between 10 and 72 pixels.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={presetId}>Font preset</Label>
        <Select
          value={presetValue}
          onValueChange={(v) => {
            if (v !== "__custom__") {
              onFontFamilyChange(v)
            }
          }}
        >
          <SelectTrigger id={presetId} className="text-xs">
            <SelectValue placeholder="Choose a preset" />
          </SelectTrigger>
          <SelectContent>
            {CAPTION_FONT_PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value} className="text-xs">
                {p.label}
              </SelectItem>
            ))}
            <SelectItem value="__custom__" className="text-xs">
              Custom (use field below)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor={familyId}>Font family (CSS)</Label>
        <Input
          id={familyId}
          value={fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="font-mono text-xs"
          aria-describedby={`${familyId}-hint`}
        />
        <p id={`${familyId}-hint`} className="text-xs text-muted-foreground">
          Any valid CSS <code className="text-foreground">font-family</code> list, for example{" "}
          <code className="text-foreground">ui-sans-serif, system-ui, sans-serif</code>.
        </p>
      </div>
    </div>
  )
}
