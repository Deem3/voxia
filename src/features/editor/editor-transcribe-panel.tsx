import {
  MicrophoneIcon as Microphone,
  XIcon as X,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatBytes } from "@/lib/format-bytes"
import { formatMutationError } from "@/lib/format-mutation-error"
import { cn } from "@/lib/utils"
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
      className={cn(
        "overflow-hidden border border-border/60 bg-card/30",
        "transition-all duration-200",
        isPending && "border-signal/20 bg-signal-muted/30",
      )}
    >
      {/* Header */}
      <header className="panel-header">
        <span
          className={cn(
            "inline-flex size-5 items-center justify-center",
            "bg-signal-muted text-signal transition-all duration-200",
            isPending && "signal-glow-sm",
          )}
          aria-hidden
        >
          <Microphone
            className={cn("size-3", isPending && "animate-pulse")}
            weight="fill"
          />
        </span>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-foreground/80">
          Transcribe
        </p>
        <div className="ml-auto flex items-center gap-2">
          {isPending && (
            <span className="flex items-center gap-1.5 text-[0.6rem] font-medium text-signal animate-fade-in">
              <span
                className="size-1.5 rounded-full bg-signal dot-pulse"
                aria-hidden
              />
              Running
            </span>
          )}
          <span className="font-mono text-[0.58rem] text-muted-foreground/60">
            Whisper · local
          </span>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-2.5 p-3">
        <label className="grid gap-1 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
          Model
          <select
            className={cn(
              "h-8 min-w-[180px] border border-input bg-background/80 px-2",
              "font-mono text-xs text-foreground",
              "transition-colors hover:border-signal/40 focus:border-signal focus:outline-none",
              "disabled:opacity-40",
            )}
            value={modelId}
            onChange={(e) => onModelIdChange(e.target.value)}
            disabled={!hasWhisper || isPending}
            aria-label="Whisper model"
          >
            {!hasWhisper ? (
              <option value="">No model installed</option>
            ) : (
              installedModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))
            )}
          </select>
        </label>

        <label className="grid min-w-[120px] flex-1 gap-1 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
          Language
          <input
            className={cn(
              "h-8 border border-input bg-background/80 px-2",
              "font-mono text-xs text-foreground placeholder:text-muted-foreground/40",
              "transition-colors hover:border-signal/40 focus:border-signal focus:outline-none",
            )}
            placeholder="auto"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            disabled={isPending}
            aria-label="Whisper language code"
          />
        </label>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="default"
            variant={isPending ? "secondary" : "default"}
            disabled={!hasWhisper || isPending}
            onClick={onRun}
            title="Run Whisper transcription"
            className="gap-1.5"
          >
            <Microphone className="size-3.5 shrink-0" weight="duotone" aria-hidden />
            {isPending ? "Transcribing…" : "Run transcription"}
          </Button>

          {isPending && taskId ? (
            <Button
              type="button"
              size="default"
              variant="outline"
              onClick={onCancel}
              title="Cancel"
              className="gap-1.5 animate-fade-in"
            >
              <X className="size-3.5 shrink-0" weight="bold" aria-hidden />
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      {/* No model warning */}
      {!hasWhisper ? (
        <div className="border-t border-destructive/20 bg-destructive/5 px-3 py-2 animate-status-in">
          <p className="text-xs text-destructive/90">
            No Whisper model installed.{" "}
            <span className="font-medium">
              Download <code className="font-mono">tiny</code> or{" "}
              <code className="font-mono">base</code> in Settings → Models.
            </span>
          </p>
        </div>
      ) : null}

      {/* Progress */}
      {isPending ? (
        <TranscribeProgressView
          whisperPercent={whisperPercent}
          pcmBytes={pcmBytes}
        />
      ) : null}

      {/* Error */}
      {isError ? (
        <div
          role="alert"
          className="border-t border-destructive/30 bg-destructive/8 px-3 py-2.5 animate-status-in"
        >
          <p className="text-[0.65rem] font-semibold text-destructive">
            Transcription failed
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words font-mono text-[0.6rem] text-foreground/80">
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
  <div className="space-y-2.5 border-t border-signal/15 bg-signal-muted/20 px-3 py-2.5">
    {whisperPercent === null ? (
      <div className="flex items-center gap-2.5 animate-fade-in">
        <span
          className={cn(
            "inline-flex size-4 items-center justify-center",
            "rounded-full border-2 border-signal/60 border-t-signal",
          )}
          style={{ animation: "v-orbit 0.8s linear infinite" }}
          aria-hidden
        />
        <p className="font-mono text-[0.6rem] text-muted-foreground">
          {pcmBytes !== null
            ? <>Extracting audio · <span className="text-signal font-medium">{formatBytes(pcmBytes)}</span> PCM decoded</>
            : "Extracting audio via ffmpeg…"
          }
        </p>
      </div>
    ) : null}

    {whisperPercent !== null ? (
      <div className="space-y-1.5 animate-fade-in">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[0.6rem] text-muted-foreground">
            <span
              className="size-1.5 rounded-full bg-signal dot-pulse"
              aria-hidden
            />
            Whisper inference
          </span>
          <span className="font-mono text-[0.6rem] font-semibold text-signal tabular-nums">
            {whisperPercent}%
          </span>
        </div>
        <Progress
          value={whisperPercent}
          aria-label={`Transcription ${whisperPercent}%`}
        />
      </div>
    ) : null}
  </div>
)
