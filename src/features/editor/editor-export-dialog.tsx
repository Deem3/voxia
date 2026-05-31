import { ExportIcon as Export } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type {
  ExportFormat,
  ExportMode,
} from "@/features/editor/hooks/use-export-subtitles-mutation"
import { formatMutationError } from "@/lib/format-mutation-error"
import { cn } from "@/lib/utils"

type EditorExportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  format: ExportFormat
  onFormatChange: (next: ExportFormat) => void
  mode: ExportMode
  onModeChange: (next: ExportMode) => void
  isPending: boolean
  isError: boolean
  error: unknown
  onConfirm: () => void
}

const selectClass = cn(
  "h-9 w-full border border-input bg-background/80 px-2",
  "font-mono text-xs text-foreground",
  "transition-colors hover:border-signal/40 focus:border-signal focus:outline-none",
)

export const EditorExportDialog = ({
  open,
  onOpenChange,
  format,
  onFormatChange,
  mode,
  onModeChange,
  isPending,
  isError,
  error,
  onConfirm,
}: EditorExportDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-sm border-border/70 bg-card/95 backdrop-blur-md">
      <DialogHeader className="space-y-2">
        <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="inline-flex size-6 items-center justify-center bg-signal-muted text-signal">
            <Export className="size-3.5" weight="duotone" aria-hidden />
          </span>
          Export subtitles
        </DialogTitle>
        <DialogDescription className="text-[0.7rem] text-muted-foreground/70">
          Choose format and track layout — a save dialog opens next.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-1">
        {/* Format */}
        <div className="grid gap-1.5">
          <label className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
            Format
          </label>
          <select
            className={selectClass}
            value={format}
            onChange={(e) => onFormatChange(e.target.value as ExportFormat)}
          >
            <option value="srt">SRT — universal subtitle format</option>
            <option value="vtt">VTT — web video text tracks</option>
          </select>
        </div>

        {/* Track */}
        <div className="grid gap-1.5">
          <label className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
            Track layout
          </label>
          <select
            className={selectClass}
            value={mode}
            onChange={(e) => onModeChange(e.target.value as ExportMode)}
          >
            <option value="original">Original — transcribed only</option>
            <option value="translated">Translated — translation only</option>
            <option value="bilingual">Bilingual — both stacked</option>
          </select>
        </div>
      </div>

      <DialogFooter className="gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(false)}
          className="text-muted-foreground"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="signal"
          size="sm"
          disabled={isPending}
          onClick={onConfirm}
          className="gap-1.5"
        >
          {isPending ? (
            <>
              <span
                className="size-3 rounded-full border border-current border-t-transparent"
                style={{ animation: "v-orbit 0.7s linear infinite" }}
                aria-hidden
              />
              Exporting…
            </>
          ) : (
            <>
              <Export className="size-3.5 shrink-0" weight="duotone" aria-hidden />
              Choose file &amp; export
            </>
          )}
        </Button>
      </DialogFooter>

      {isError ? (
        <div
          role="alert"
          className="border border-destructive/30 bg-destructive/8 px-3 py-2 animate-status-in"
        >
          <p className="text-[0.65rem] font-semibold text-destructive">Export failed</p>
          <p className="mt-1 font-mono text-[0.6rem] text-foreground/80">
            {formatMutationError(error)}
          </p>
        </div>
      ) : null}
    </DialogContent>
  </Dialog>
)
