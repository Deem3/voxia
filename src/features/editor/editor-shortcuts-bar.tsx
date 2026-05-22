import { KeyboardIcon as Keyboard } from "@phosphor-icons/react"

const SHORTCUTS: ReadonlyArray<readonly [string, string]> = [
  ["Space", "play"],
  ["J/L", "±5s"],
  ["K", "pause"],
  ["Enter", "split"],
  ["⌫", "merge"],
  ["Tab", "next cue"],
]

/** Footer-style shortcut legend rendered below the editor panels. */
export const EditorShortcutsBar = () => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border pt-3 text-[0.65rem] text-muted-foreground">
    <span className="flex items-center gap-1.5 font-medium uppercase tracking-[0.18em] text-foreground/70">
      <Keyboard className="size-3.5" weight="duotone" aria-hidden />
      Shortcuts
    </span>
    {SHORTCUTS.map(([key, label]) => (
      <span key={key} className="inline-flex items-center gap-1.5">
        <kbd className="inline-flex h-5 min-w-[1.25rem] items-center justify-center border border-border bg-card/60 px-1 font-mono text-[0.6rem] text-foreground/80">
          {key}
        </kbd>
        <span>{label}</span>
      </span>
    ))}
  </div>
)
