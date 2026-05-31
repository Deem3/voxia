import { useVirtualizer } from "@tanstack/react-virtual"
import { useEffect, useMemo, useRef, type KeyboardEvent } from "react"

import { formatMsHms } from "@/lib/timecode"
import { cn } from "@/lib/utils"
import { usePlayerStore } from "@/store/usePlayerStore"
import type { Cue } from "@/types/voxia"

const ROW_ESTIMATE_H = 90
const TEXT_CELL_MAX_H = "5rem"

export type EditorCueRailProps = {
  cues: Cue[]
  bilingual: boolean
  selectedIndex: number | null
  onSeek: (ms: number) => void
  onSelectCue: (index: number) => void
  className?: string
}

const findActiveCueIndex = (cues: Cue[], currentTimeMs: number) =>
  cues.findIndex((c) => currentTimeMs >= c.startMs && currentTimeMs < c.endMs)

export const EditorCueRail = ({
  cues,
  bilingual,
  selectedIndex,
  onSeek,
  onSelectCue,
  className,
}: EditorCueRailProps) => {
  const currentTimeMs = usePlayerStore((s) => s.currentTimeMs)
  const playing = usePlayerStore((s) => s.playing)

  const scrollParentRef = useRef<HTMLDivElement>(null)
  const prevActiveRef = useRef<number>(-2)

  const activeIndex = useMemo(
    () => findActiveCueIndex(cues, currentTimeMs),
    [cues, currentTimeMs],
  )

  const virtualizer = useVirtualizer({
    count: cues.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => ROW_ESTIMATE_H,
    overscan: 8,
  })

  useEffect(() => {
    if (!playing) { prevActiveRef.current = activeIndex; return }
    if (activeIndex < 0) { prevActiveRef.current = activeIndex; return }
    if (activeIndex === prevActiveRef.current) return
    prevActiveRef.current = activeIndex
    virtualizer.scrollToIndex(activeIndex, { align: "center" })
  }, [activeIndex, playing, virtualizer])

  const handleCueActivate = (index: number, startMs: number) => {
    onSelectCue(index)
    onSeek(startMs)
    virtualizer.scrollToIndex(index, { align: "center" })
  }

  if (cues.length === 0) {
    return (
      <div className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center",
        className,
      )}>
        <div className="size-8 rounded-full border border-border/40 bg-muted/20 flex items-center justify-center text-muted-foreground/40">
          <span className="font-mono text-xs">∅</span>
        </div>
        <p className="text-[0.65rem] leading-snug text-muted-foreground/60">
          Transcribe the video to see cues here.
          <br />
          Times will track playback automatically.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={scrollParentRef}
      id="editor-cue-rail-scroll"
      className={cn("min-h-0 flex-1 overflow-auto", className)}
      role="list"
      aria-label="Cues in playback order"
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((vi) => {
          const cue = cues[vi.index]
          if (!cue) return null
          const isPlayhead = activeIndex === vi.index
          const isSelected = selectedIndex === vi.index
          const hasTranslation = !!cue.translatedText?.trim()

          const handleActivate = () => handleCueActivate(vi.index, cue.startMs)
          const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              handleActivate()
            }
          }

          return (
            <div
              key={cue.id}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              className={cn(
                "absolute top-0 left-0 z-0 w-full border-b border-border/40 transition-colors duration-100",
                isPlayhead && "z-[1] border-b-signal/20",
              )}
              style={{ transform: `translateY(${vi.start}px)` }}
              role="listitem"
            >
              <div
                className={cn(
                  "relative flex cursor-pointer flex-col gap-1.5 py-2 pl-4 pr-3 text-left",
                  "outline-none transition-all duration-100",
                  "hover:bg-muted/30",
                  "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-signal/40",
                  isPlayhead && "bg-signal-muted/60 hover:bg-signal-muted/70",
                  isSelected && !isPlayhead && "bg-muted/40",
                )}
                role="button"
                tabIndex={0}
                aria-current={isPlayhead ? "true" : undefined}
                aria-label={`Cue ${vi.index + 1}, ${formatMsHms(cue.startMs)} to ${formatMsHms(cue.endMs)}`}
                onClick={handleActivate}
                onKeyDown={handleKeyDown}
              >
                {/* Active indicator */}
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 w-0.5 transition-all duration-150 origin-center",
                    isPlayhead
                      ? "bg-signal opacity-100"
                      : isSelected
                        ? "bg-foreground/30 opacity-100"
                        : "opacity-0",
                  )}
                  aria-hidden
                />

                {/* Timecode row */}
                <p className="shrink-0 font-mono text-[0.58rem] leading-none tabular-nums">
                  <span className={cn(
                    "font-semibold transition-colors",
                    isPlayhead ? "text-signal" : "text-foreground/80",
                  )}>
                    {formatMsHms(cue.startMs)}
                  </span>
                  <span className="mx-0.5 text-muted-foreground/40">→</span>
                  <span className="text-muted-foreground/70">
                    {formatMsHms(cue.endMs)}
                  </span>
                  {/* Index badge */}
                  <span className="ml-1.5 text-muted-foreground/30">
                    #{vi.index + 1}
                  </span>
                </p>

                {/* Text cells */}
                <div className="grid grid-cols-2 gap-1.5">
                  <TextCell
                    label="Source"
                    text={cue.text}
                    isPlayhead={isPlayhead}
                  />
                  <TextCell
                    label={bilingual ? "Translated" : "Translation"}
                    text={hasTranslation ? (cue.translatedText ?? "") : ""}
                    placeholder={hasTranslation ? undefined : "—"}
                    dim={!hasTranslation}
                    isPlayhead={false}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const TextCell = ({
  label,
  text,
  placeholder = "…",
  dim = false,
  isPlayhead,
}: {
  label: string
  text: string
  placeholder?: string
  dim?: boolean
  isPlayhead: boolean
}) => (
  <div className={cn(
    "min-w-0 overflow-hidden border border-transparent bg-background/30 px-1.5 py-1",
    "transition-colors hover:border-border/40 hover:bg-background/60",
  )}>
    <span className="mb-0.5 block text-[0.5rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
      {label}
    </span>
    <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: TEXT_CELL_MAX_H }}>
      <p className={cn(
        "break-words whitespace-pre-wrap text-[0.68rem] leading-snug",
        dim ? "text-muted-foreground/40" : isPlayhead ? "text-foreground" : "text-foreground/80",
      )}>
        {text || placeholder}
      </p>
    </div>
  </div>
)
