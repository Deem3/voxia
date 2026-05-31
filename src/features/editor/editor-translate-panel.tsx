import { CheckCircleIcon as CheckCircle, TranslateIcon as Translate } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { TranslateProgress } from "@/features/editor/hooks/use-translate-mutation"
import { formatMutationError } from "@/lib/format-mutation-error"
import { cn } from "@/lib/utils"

type EditorTranslatePanelProps = {
  cueCount: number
  provider: string
  onProviderChange: (next: string) => void
  sourceLang: string
  onSourceLangChange: (next: string) => void
  targetLang: string
  onTargetLangChange: (next: string) => void
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  error: unknown
  progress: TranslateProgress | null
  onRun: () => void
}

const fieldClass = cn(
  "h-8 border border-input bg-background/80 px-2",
  "font-mono text-xs text-foreground placeholder:text-muted-foreground/40",
  "transition-colors hover:border-signal/40 focus:border-signal focus:outline-none",
)

export const EditorTranslatePanel = ({
  cueCount,
  provider,
  onProviderChange,
  sourceLang,
  onSourceLangChange,
  targetLang,
  onTargetLangChange,
  isPending,
  isSuccess,
  isError,
  error,
  progress,
  onRun,
}: EditorTranslatePanelProps) => {
  const buttonLabel =
    isPending && progress
      ? `${progress.done}/${progress.total}`
      : isPending
        ? "Translating…"
        : "Translate all"

  return (
    <section
      aria-label="Translate cues"
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
          <Translate
            className={cn("size-3", isPending && "animate-pulse")}
            weight="fill"
          />
        </span>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-foreground/80">
          Translate
        </p>
        <div className="ml-auto flex items-center gap-2">
          {isPending && progress && (
            <span className="flex items-center gap-1.5 text-[0.6rem] font-medium text-signal animate-fade-in">
              <span className="size-1.5 rounded-full bg-signal dot-pulse" aria-hidden />
              {progress.done}/{progress.total}
            </span>
          )}
          <span className="font-mono text-[0.58rem] text-muted-foreground/60">
            {cueCount} cue{cueCount === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-2.5 p-3">
        <label className="grid gap-1 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
          Provider
          <select
            className={cn(fieldClass, "min-w-[180px]")}
            value={provider}
            onChange={(e) => onProviderChange(e.target.value)}
            disabled={isPending}
            aria-label="Translator provider"
          >
            <option value="google">google (free / API key optional)</option>
            <option value="deepseek">deepseek (API key required)</option>
            <option value="nllb">nllb (local)</option>
            <option value="azure">azure</option>
          </select>
        </label>

        <div className="flex items-end gap-1.5">
          <label className="grid gap-1 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
            Source
            <input
              className={cn(fieldClass, "w-20")}
              value={sourceLang}
              onChange={(e) => onSourceLangChange(e.target.value)}
              disabled={isPending}
              aria-label="Source language"
              placeholder="auto"
            />
          </label>

          <span className="mb-1.5 text-muted-foreground/40 text-xs" aria-hidden>→</span>

          <label className="grid gap-1 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
            Target
            <input
              className={cn(fieldClass, "w-20")}
              value={targetLang}
              onChange={(e) => onTargetLangChange(e.target.value)}
              disabled={isPending}
              aria-label="Target language"
            />
          </label>
        </div>

        <Button
          type="button"
          size="default"
          variant={isPending ? "secondary" : "default"}
          disabled={isPending || cueCount === 0}
          onClick={onRun}
          title="Translate all cues"
          className="gap-1.5"
        >
          <Translate className="size-3.5 shrink-0" weight="duotone" aria-hidden />
          {buttonLabel}
        </Button>
      </div>

      {/* Progress view */}
      {isPending && progress && progress.total > 0 ? (
        <div className="space-y-1.5 border-t border-signal/15 bg-signal-muted/20 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-mono text-[0.6rem] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-signal dot-pulse" aria-hidden />
              {progress.done} of {progress.total} cues
              {progress.done >= progress.total ? " — finishing…" : ""}
            </span>
            <span className="font-mono text-[0.6rem] font-semibold text-signal tabular-nums">
              {Math.round((progress.done / progress.total) * 100)}%
            </span>
          </div>
          <Progress
            value={Math.round((progress.done / progress.total) * 100)}
            aria-label={`Translation ${progress.done}/${progress.total}`}
          />
        </div>
      ) : null}

      {/* Success */}
      {isSuccess && !isPending ? (
        <div className="flex items-center gap-2 border-t border-emerald-500/20 bg-emerald-500/5 px-3 py-2 animate-status-in">
          <CheckCircle className="size-3.5 shrink-0 text-emerald-500" weight="fill" aria-hidden />
          <p className="text-[0.65rem] font-medium text-emerald-600 dark:text-emerald-400">
            Translation complete — cues updated.
          </p>
        </div>
      ) : null}

      {/* Error */}
      {isError ? (
        <div role="alert" className="border-t border-destructive/30 bg-destructive/8 px-3 py-2.5 animate-status-in">
          <p className="text-[0.65rem] font-semibold text-destructive">Translation failed</p>
          <p className="mt-1 whitespace-pre-wrap break-words font-mono text-[0.6rem] text-foreground/80">
            {formatMutationError(error)}
          </p>
        </div>
      ) : null}
    </section>
  )
}
