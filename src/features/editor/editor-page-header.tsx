import {
  ArrowUUpLeftIcon as ArrowUUpLeft,
  ArrowUUpRightIcon as ArrowUUpRight,
  ExportIcon as Export,
} from "@phosphor-icons/react"

import { BackToLibraryLink } from "@/components/back-to-library-link"
import { Button } from "@/components/ui/button"
import { EditorCueDrawerTrigger } from "@/features/editor/editor-cue-drawer"
import { cn } from "@/lib/utils"

type EditorPageHeaderProps = {
  projectPath: string
  projectTitle: string
  cueCount: number
  onUndo: () => void
  onRedo: () => void
  onOpenCues: () => void
  onOpenExport: () => void
}

export const EditorPageHeader = ({
  projectPath,
  projectTitle,
  cueCount,
  onUndo,
  onRedo,
  onOpenCues,
  onOpenExport,
}: EditorPageHeaderProps) => (
  <div className="w-full min-w-0 space-y-3 overflow-hidden pb-4 border-b border-border/50 animate-fade-up">
    <BackToLibraryLink />
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.28em] text-signal/70">
          <span className="inline-block h-[2px] w-5 rounded-full bg-signal" aria-hidden />
          Editor
        </p>
        <h1
          className="truncate text-xl font-semibold tracking-tight text-foreground"
          title={projectPath}
        >
          {projectTitle}
        </h1>
        <p
          className="truncate font-mono text-[0.6rem] text-muted-foreground/60"
          title={projectPath}
        >
          {projectPath}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {/* Undo/redo group */}
        <div className={cn(
          "flex items-center border border-border/60 bg-card/40 p-0.5 gap-px",
        )}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onUndo}
            title="Undo (⌘Z)"
            aria-label="Undo"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowUUpLeft className="size-3.5 shrink-0" weight="bold" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRedo}
            title="Redo (⇧⌘Z)"
            aria-label="Redo"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowUUpRight className="size-3.5 shrink-0" weight="bold" aria-hidden />
          </Button>
        </div>

        <EditorCueDrawerTrigger cueCount={cueCount} onOpen={onOpenCues} />

        <Button
          type="button"
          variant="signal"
          size="sm"
          onClick={onOpenExport}
          title="Export subtitles to SRT or VTT"
          className="gap-1.5"
        >
          <Export className="size-3.5 shrink-0" weight="duotone" aria-hidden />
          Export
        </Button>
      </div>
    </div>
  </div>
)
