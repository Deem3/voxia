import { TranslateIcon as Translate } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { TranslateProgress } from "@/features/editor/hooks/use-translate-mutation"
import { formatMutationError } from "@/lib/format-mutation-error"

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

/** Self-contained Translate panel: provider/language fields, run button, live progress, error/success state. */
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
      ? `Translating ${progress.done}/${progress.total}`
      : isPending
        ? "Translating…"
        : "Translate all"

  return (
    <section aria-label="Translate cues" className="border border-border bg-card/40">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span
          className="inline-flex size-6 items-center justify-center bg-signal-muted text-signal"
          aria-hidden
        >
          <Translate className="size-3.5" weight="fill" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
          Translate
        </p>
        <span className="ml-auto font-mono text-[0.6rem] text-muted-foreground">
          {cueCount} cue{cueCount === 1 ? "" : "s"}
        </span>
      </header>

      <div className="flex flex-wrap items-end gap-2 p-3">
        <label className="grid gap-1 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
          Provider
          <select
            className="h-8 min-w-[180px] border border-input bg-background px-2 font-mono text-xs transition-colors hover:border-foreground/40 focus:border-signal focus:outline-none"
            value={provider}
            onChange={(e) => onProviderChange(e.target.value)}
            aria-label="Translator provider"
          >
            <option value="google">google (API key optional)</option>
            <option value="deepseek">deepseek (API key required)</option>
            <option value="nllb">nllb (local)</option>
            <option value="azure">azure</option>
          </select>
        </label>

        <label className="grid gap-1 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
          Source
          <input
            className="h-8 w-24 border border-input bg-background px-2 font-mono text-xs transition-colors hover:border-foreground/40 focus:border-signal focus:outline-none"
            value={sourceLang}
            onChange={(e) => onSourceLangChange(e.target.value)}
            aria-label="Source language"
          />
        </label>

        <span className="self-center pb-2 text-muted-foreground" aria-hidden>
          →
        </span>

        <label className="grid gap-1 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
          Target
          <input
            className="h-8 w-24 border border-input bg-background px-2 font-mono text-xs transition-colors hover:border-foreground/40 focus:border-signal focus:outline-none"
            value={targetLang}
            onChange={(e) => onTargetLangChange(e.target.value)}
            aria-label="Target language"
          />
        </label>

        <Button
          type="button"
          size="default"
          disabled={isPending || cueCount === 0}
          onClick={onRun}
          title="Translate all cues"
        >
          <Translate className="size-4 shrink-0" weight="duotone" aria-hidden />
          {buttonLabel}
        </Button>
      </div>

      {isPending && progress && progress.total > 0 ? (
        <TranslateProgressView progress={progress} />
      ) : null}

      {isSuccess && !isPending ? (
        <p className="border-t border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
          ✓ Translation finished — updated cues are in the caption rail.
        </p>
      ) : null}

      {isError ? (
        <div
          role="alert"
          className="border-t border-destructive/40 bg-destructive/10 px-3 py-2"
        >
          <p className="text-xs font-medium text-destructive">
            Translation failed
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words font-mono text-[0.65rem] text-foreground/90">
            {formatMutationError(error)}
          </p>
        </div>
      ) : null}
    </section>
  )
}

const TranslateProgressView = ({ progress }: { progress: TranslateProgress }) => {
  const percent = Math.round((progress.done / progress.total) * 100)
  const finishing = progress.done >= progress.total
  return (
    <div className="space-y-1.5 border-t border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[0.65rem] text-muted-foreground">
          {progress.done} of {progress.total} cues
          {finishing ? " — finishing…" : ""}
        </span>
        <span className="font-mono text-[0.65rem] font-semibold text-foreground">
          {percent}%
        </span>
      </div>
      <Progress
        value={percent}
        aria-label={`Translation progress ${progress.done} of ${progress.total}`}
      />
    </div>
  )
}
