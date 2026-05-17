import { ListBullets } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { CueList } from "@/features/editor/cue-list"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Cue } from "@/types/voxia"

type EditorCueDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cues: Cue[]
  bilingual: boolean
  selectedIndex: number | null
  onSeek: (ms: number) => void
  onSelect: (index: number) => void
  onCommitText: (index: number, text: string) => void
  onCommitTranslatedText: (index: number, text: string) => void
  onCommitTimes: (index: number, startMs: number, endMs: number) => void
  onTranslateOne: (index: number) => void
}

export const EditorCueDrawer = ({
  open,
  onOpenChange,
  cues,
  bilingual,
  selectedIndex,
  onSeek,
  onSelect,
  onCommitText,
  onCommitTranslatedText,
  onCommitTimes,
  onTranslateOne,
}: EditorCueDrawerProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-xl"
        aria-describedby="editor-cue-drawer-description"
      >
        <SheetHeader className="shrink-0 space-y-1 border-b border-border px-4 py-3 pr-12 text-left">
          <SheetTitle className="text-base">Edit cues</SheetTitle>
          <SheetDescription id="editor-cue-drawer-description" className="text-xs">
            {cues.length === 0
              ? "Transcribe the video to generate cues."
              : `${cues.length} cue${cues.length === 1 ? "" : "s"} · edit transcribed and translated text`}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-hidden p-3">
          {cues.length === 0 ? (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              No cues yet — run transcription first.
            </p>
          ) : (
            <CueList
              cues={cues}
              selectedIndex={selectedIndex}
              bilingual={bilingual}
              onSelect={onSelect}
              onSeek={onSeek}
              onCommitText={onCommitText}
              onCommitTranslatedText={onCommitTranslatedText}
              onCommitTimes={onCommitTimes}
              onTranslateOne={onTranslateOne}
              className="h-full max-h-none min-h-0 border-0"
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

type EditorCueDrawerTriggerProps = {
  cueCount: number
  onOpen: () => void
}

export const EditorCueDrawerTrigger = ({
  cueCount,
  onOpen,
}: EditorCueDrawerTriggerProps) => (
  <Button
    type="button"
    variant="secondary"
    size="sm"
    onClick={onOpen}
    aria-haspopup="dialog"
    aria-label={
      cueCount > 0 ? `Edit cues drawer, ${cueCount} cues` : "Edit cues drawer"
    }
  >
    <ListBullets className="size-4 shrink-0" weight="duotone" aria-hidden />
    Edit cues
    {cueCount > 0 ? (
      <span className="font-mono text-[0.65rem] opacity-80">({cueCount})</span>
    ) : null}
  </Button>
)
