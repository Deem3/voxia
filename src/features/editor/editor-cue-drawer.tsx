import { ListBulletsIcon as ListBullets } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { CueList } from "@/features/editor/cue-list"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
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
}: EditorCueDrawerProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side="right"
      className={cn(
        "flex h-full w-full flex-col gap-0 p-0",
        "sm:max-w-lg",
        "border-l border-border/60 bg-background/98 backdrop-blur-sm",
      )}
      aria-describedby="cue-drawer-desc"
    >
      <SheetHeader className={cn(
        "shrink-0 space-y-1 border-b border-border/50 px-4 py-3 pr-12 text-left",
        "bg-gradient-to-b from-muted/20 to-transparent",
      )}>
        <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="inline-block h-[2px] w-3 rounded-full bg-signal" aria-hidden />
          Edit cues
        </SheetTitle>
        <SheetDescription id="cue-drawer-desc" className="text-[0.65rem] text-muted-foreground/60">
          {cues.length === 0
            ? "Transcribe the video to generate cues."
            : `${cues.length} cue${cues.length === 1 ? "" : "s"} · edit transcribed and translated text`}
        </SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 overflow-hidden">
        {cues.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <div className="size-8 rounded-full border border-border/40 bg-muted/20 flex items-center justify-center text-muted-foreground/40">
              <span className="font-mono text-xs">∅</span>
            </div>
            <p className="text-xs text-muted-foreground/60">
              Run transcription first to generate cues.
            </p>
          </div>
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

export const EditorCueDrawerTrigger = ({
  cueCount,
  onOpen,
}: {
  cueCount: number
  onOpen: () => void
}) => (
  <Button
    type="button"
    variant="secondary"
    size="sm"
    onClick={onOpen}
    aria-haspopup="dialog"
    aria-label={cueCount > 0 ? `Edit cues (${cueCount})` : "Edit cues"}
    className="gap-1.5"
  >
    <ListBullets className="size-3.5 shrink-0" weight="duotone" aria-hidden />
    Edit cues
    {cueCount > 0 && (
      <span className="font-mono text-[0.6rem] opacity-70">({cueCount})</span>
    )}
  </Button>
)
