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

/** Modal for picking subtitle export format and mode. */
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
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Export className="size-5 text-signal" weight="duotone" aria-hidden />
          Export subtitles
        </DialogTitle>
        <DialogDescription id="export-dialog-desc">
          Choose format and track layout. A save dialog opens next.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-2">
        <label className="grid gap-1.5 text-sm">
          <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            Format
          </span>
          <select
            className="h-9 border border-input bg-background px-2 transition-colors hover:border-foreground/40 focus:border-signal focus:outline-none"
            value={format}
            onChange={(e) => onFormatChange(e.target.value as ExportFormat)}
          >
            <option value="srt">SRT — universal subtitle format</option>
            <option value="vtt">VTT — web video text tracks</option>
          </select>
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            Track layout
          </span>
          <select
            className="h-9 border border-input bg-background px-2 transition-colors hover:border-foreground/40 focus:border-signal focus:outline-none"
            value={mode}
            onChange={(e) => onModeChange(e.target.value as ExportMode)}
          >
            <option value="original">Original — transcribed text only</option>
            <option value="translated">Translated — translated text only</option>
            <option value="bilingual">Bilingual — both stacked</option>
          </select>
        </label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" disabled={isPending} onClick={onConfirm}>
          <Export className="size-4 shrink-0" weight="duotone" aria-hidden />
          {isPending ? "Exporting…" : "Choose file & export"}
        </Button>
      </DialogFooter>

      {isError ? (
        <div
          role="alert"
          className="border border-destructive/40 bg-destructive/10 px-3 py-2"
        >
          <p className="text-xs font-medium text-destructive">Export failed</p>
          <p className="mt-1 whitespace-pre-wrap break-words font-mono text-[0.65rem] text-foreground/90">
            {formatMutationError(error)}
          </p>
        </div>
      ) : null}
    </DialogContent>
  </Dialog>
)
