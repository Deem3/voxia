import {
  ArrowUUpLeftIcon as ArrowUUpLeft,
  ArrowUUpRightIcon as ArrowUUpRight,
  ExportIcon as Export,
} from "@phosphor-icons/react"

import { BackToLibraryLink } from "@/components/back-to-library-link"
import { Button } from "@/components/ui/button"
import { EditorCueDrawerTrigger } from "@/features/editor/editor-cue-drawer"

type EditorPageHeaderProps = {
  projectPath: string
  projectTitle: string
  cueCount: number
  onUndo: () => void
  onRedo: () => void
  onOpenCues: () => void
  onOpenExport: () => void
}

/** Editor page hero: back link, project title, and primary toolbar (undo/redo, cues, export). */
export const EditorPageHeader = ({
  projectPath,
  projectTitle,
  cueCount,
  onUndo,
  onRedo,
  onOpenCues,
  onOpenExport,
}: EditorPageHeaderProps) => (
  <div className="w-full min-w-0 space-y-3 overflow-hidden border-b border-border pb-4">
    <BackToLibraryLink />
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="inline-flex h-1 w-6 bg-signal" aria-hidden />
          Editor
        </p>
        <h1
          className="truncate text-2xl font-semibold tracking-tight text-foreground"
          title={projectPath}
        >
          {projectTitle}
        </h1>
        <p
          className="truncate font-mono text-[0.65rem] text-muted-foreground"
          title={projectPath}
        >
          {projectPath}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-px border border-border bg-card/60 p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onUndo}
            title="Undo last edit (⌘Z)"
            aria-label="Undo"
          >
            <ArrowUUpLeft className="size-4 shrink-0" weight="bold" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRedo}
            title="Redo (⇧⌘Z)"
            aria-label="Redo"
          >
            <ArrowUUpRight className="size-4 shrink-0" weight="bold" aria-hidden />
          </Button>
        </div>
        <EditorCueDrawerTrigger cueCount={cueCount} onOpen={onOpenCues} />
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onOpenExport}
          title="Export subtitles to SRT or VTT"
        >
          <Export className="size-4 shrink-0" weight="duotone" aria-hidden />
          Export
        </Button>
      </div>
    </div>
  </div>
)
