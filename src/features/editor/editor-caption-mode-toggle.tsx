import { TextAaIcon as TextAa } from "@phosphor-icons/react"

import {
  CAPTION_TEXT_MODE_OPTIONS,
  type CaptionTextMode,
} from "@/features/editor/caption-text-mode"

type EditorCaptionModeToggleProps = {
  value: CaptionTextMode
  onChange: (next: CaptionTextMode) => void
}

/** Inline selector that controls which caption track is rendered on the video overlay. */
export const EditorCaptionModeToggle = ({
  value,
  onChange,
}: EditorCaptionModeToggleProps) => (
  <label className="flex flex-wrap items-center gap-2 border border-border bg-card/40 px-3 py-2 text-xs">
    <TextAa className="size-4 shrink-0 text-signal" weight="duotone" aria-hidden />
    <span className="font-medium text-foreground">On-video caption</span>
    <select
      className="ml-auto h-7 border border-input bg-background px-2 font-mono text-xs text-foreground transition-colors hover:border-foreground/40 focus:border-signal focus:outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value as CaptionTextMode)}
      aria-label="Caption text shown on video"
    >
      {CAPTION_TEXT_MODE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </label>
)
