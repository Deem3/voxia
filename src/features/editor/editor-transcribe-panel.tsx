import {
  MicrophoneIcon as Microphone,
  XIcon as X,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatBytes } from "@/lib/format-bytes"
import { formatMutationError } from "@/lib/format-mutation-error"
import type { ModelRow } from "@/types/voxia"

type EditorTranscribePanelProps = {
  installedModels: ModelRow[]
  modelId: string
  onModelIdChange: (id: string) => void
  language: string
  onLanguageChange: (lang: string) => void
  isPending: boolean
  isError: boolean
  error: unknown
  whisperPercent: number | null
  pcmBytes: number | null
  taskId: string | null
  onRun: () => void
  onCancel: () => void
}

/** Self-contained Transcribe panel: model picker, language input, run/cancel buttons, and live progress. */
export const EditorTranscribePanel = ({
  installedModels,
  modelId,
  onModelIdChange,
  language,
  onLanguageChange,
  isPending,
  isError,
  error,
  whisperPercent,
  pcmBytes,
  taskId,
  onRun,
  onCancel,
}: EditorTranscribePanelProps) => {
  const hasWhisper = installedModels.length > 0

  return (
    <section
      aria-label="Transcribe with Whisper"
      className="border border-border bg-card/40"
    >
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span
          className="inline-flex size-6 items-center justify-center bg-signal-muted text-signal"
          aria-hidden
        >
          <Microphone className="size-3.5" weight="fill" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
          Transcribe
        </p>
        <span className="ml-auto font-mono text-[0.6rem] text-muted-foreground">
          Whisper · local
        </span>
      </header>

      <div className="flex flex-wrap items-end gap-2 p-3">
        <label className="grid gap-1 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
          Model
          <select
            className="h-8 min-w-[180px] border border-input bg-background px-2 font-mono text-xs transition-colors hover:border-foreground/40 focus:border-signal focus:outline-none disabled:opacity-50"
            value={modelId}
            onChange={(e) => onModelIdChange(e.target.value)}
            disabled={!hasWhisper}
            aria-label="Whisper model (installed only)"
          >
            {!hasWhisper ? (
              <option value="">No model installed</option>
            ) : (
              installedModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName} ({m.id})
                </option>
              ))
            )}
          </select>
        </label>

        <label className="grid min-w-[140px] flex-1 gap-1 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
          Language
          <input
            className="h-8 border border-input bg-background px-2 font-mono text-xs transition-colors hover:border-foreground/40 focus:border-signal focus:outline-none"
            placeholder="auto"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            aria-label="Whisper language code"
          />
        </label>

        <Button
          type="button"
          size="default"
          disabled={!hasWhisper || isPending}
          onClick={onRun}
          title="Run Whisper transcription on this video"
        >
          <Microphone className="size-4 shrink-0" weight="duotone" aria-hidden />
          {isPending ? "Transcribing…" : "Run transcription"}
        </Button>

        {isPending && taskId ? (
          <Button
            type="button"
            size="default"
            variant="outline"
            onClick={onCancel}
            title="Cancel transcription"
          >
            <X className="size-4 shrink-0" weight="bold" aria-hidden />
            Cancel
          </Button>
        ) : null}
      </div>

      {!hasWhisper ? (
        <p className="border-t border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          No Whisper model installed. Download{" "}
          <span className="font-mono">tiny</span> or{" "}
          <span className="font-mono">base</span> in Settings → Models.
        </p>
      ) : null}

      {isPending ? (
        <TranscribeProgressView
          whisperPercent={whisperPercent}
          pcmBytes={pcmBytes}
        />
      ) : null}

      {isError ? (
        <div
          role="alert"
          className="border-t border-destructive/40 bg-destructive/10 px-3 py-2"
        >
          <p className="text-xs font-medium text-destructive">
            Transcription failed
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words font-mono text-[0.65rem] text-foreground/90">
            {formatMutationError(error)}
          </p>
        </div>
      ) : null}
    </section>
  )
}

const TranscribeProgressView = ({
  whisperPercent,
  pcmBytes,
}: {
  whisperPercent: number | null
  pcmBytes: number | null
}) => (
  <div className="space-y-2 border-t border-border bg-muted/30 px-3 py-2">
    {whisperPercent === null ? (
      pcmBytes !== null ? (
        <p className="font-mono text-[0.65rem] text-muted-foreground">
          <span className="mr-2 inline-block animate-pulse text-signal">●</span>
          Extracting audio (ffmpeg): {formatBytes(pcmBytes)} PCM
        </p>
      ) : (
        <p className="font-mono text-[0.65rem] text-muted-foreground">
          <span className="mr-2 inline-block animate-pulse text-signal">●</span>
          Extracting audio (ffmpeg)… long files take a moment.
        </p>
      )
    ) : null}
    {whisperPercent !== null ? (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[0.65rem] text-muted-foreground">
            Whisper transcription
          </span>
          <span className="font-mono text-[0.65rem] font-semibold text-foreground">
            {whisperPercent}%
          </span>
        </div>
        <Progress
          value={whisperPercent}
          aria-label={`Transcription progress ${whisperPercent}%`}
        />
      </div>
    ) : null}
  </div>
)
