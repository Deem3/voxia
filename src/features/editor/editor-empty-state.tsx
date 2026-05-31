import { FilmStripIcon as FilmStrip, WaveformIcon as Waveform } from "@phosphor-icons/react"
import { BackToLibraryLink } from "@/components/back-to-library-link"
import { cn } from "@/lib/utils"

type EditorEmptyStateProps = {
  variant: "missing" | "loading"
}

export const EditorEmptyState = ({ variant }: EditorEmptyStateProps) => (
  <div className={cn(
    "mx-auto max-w-sm flex flex-col items-center justify-center gap-6 py-20 text-center",
    "animate-fade-up",
  )}>
    {/* Icon */}
    <div className={cn(
      "relative inline-flex size-16 items-center justify-center",
      "border border-border/50 bg-muted/20",
    )}>
      {variant === "loading" ? (
        <>
          <Waveform
            className="size-7 text-signal animate-pulse"
            weight="duotone"
            aria-hidden
          />
          {/* Spinner ring */}
          <span
            className="absolute inset-1 rounded-full border-2 border-signal/20 border-t-signal/60"
            style={{ animation: "v-orbit 1.2s linear infinite" }}
            aria-hidden
          />
        </>
      ) : (
        <FilmStrip className="size-7 text-muted-foreground/40" weight="duotone" aria-hidden />
      )}
    </div>

    {/* Copy */}
    <div className="space-y-2">
      <h1 className="text-base font-semibold tracking-tight text-foreground">
        {variant === "loading" ? "Loading project…" : "No project selected"}
      </h1>
      <p className="text-xs leading-relaxed text-muted-foreground/70">
        {variant === "missing"
          ? "Pick a project from the library to open the editor."
          : "Reading your project file and preparing the timeline."}
      </p>
    </div>

    {variant === "missing" ? (
      <BackToLibraryLink />
    ) : null}
  </div>
)
