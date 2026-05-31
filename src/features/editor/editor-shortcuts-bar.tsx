import { KeyboardIcon as Keyboard } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

const SHORTCUTS: ReadonlyArray<readonly [string, string]> = [
  ["Space", "play / pause"],
  ["J/L", "±5 sec"],
  ["K", "pause"],
  ["Enter", "split cue"],
  ["⌫", "merge cue"],
  ["Tab", "next cue"],
  ["⌘Z", "undo"],
  ["⇧⌘Z", "redo"],
]

export const EditorShortcutsBar = () => (
  <div className={cn(
    "flex flex-wrap items-center gap-x-3 gap-y-1.5",
    "border-t border-border/40 pt-3",
    "text-[0.6rem] text-muted-foreground/60",
    "animate-fade-in delay-200",
  )}>
    <span className="flex items-center gap-1.5 font-semibold uppercase tracking-[0.18em] text-foreground/40">
      <Keyboard className="size-3" weight="duotone" aria-hidden />
      Shortcuts
    </span>
    {SHORTCUTS.map(([key, label]) => (
      <span key={key} className="flex items-center gap-1">
        <kbd className={cn(
          "inline-flex h-4.5 min-w-[1.15rem] items-center justify-center px-1",
          "border border-border/50 bg-muted/30 text-[0.58rem] font-semibold text-foreground/60",
        )}>
          {key}
        </kbd>
        <span className="text-muted-foreground/50">{label}</span>
      </span>
    ))}
  </div>
)
