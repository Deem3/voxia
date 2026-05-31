import { TextAaIcon as TextAa } from "@phosphor-icons/react"

import {
  CAPTION_TEXT_MODE_OPTIONS,
  type CaptionTextMode,
} from "@/features/editor/caption-text-mode"
import { cn } from "@/lib/utils"

type EditorCaptionModeToggleProps = {
  value: CaptionTextMode
  onChange: (next: CaptionTextMode) => void
}

export const EditorCaptionModeToggle = ({
  value,
  onChange,
}: EditorCaptionModeToggleProps) => (
  <div className={cn(
    "flex items-center justify-between gap-2",
    "border border-border/50 bg-card/20 px-3 py-1.5",
    "transition-colors hover:bg-card/30",
  )}>
    <label
      className="flex items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70"
      htmlFor="caption-mode-select"
    >
      <TextAa className="size-3.5 shrink-0 text-signal/70" weight="duotone" aria-hidden />
      Caption overlay
    </label>
    <div className="flex items-center border border-border/50 bg-background/50 overflow-hidden">
      {CAPTION_TEXT_MODE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "h-6 px-2.5 font-mono text-[0.6rem] font-medium transition-all duration-150",
            value === opt.value
              ? "bg-signal text-signal-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
)
