import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useEffect,
  useMemo,
  useRef,
  type KeyboardEvent,
} from "react";

import { formatMsHms } from "@/lib/timecode";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Cue } from "@/types/voxia";

/** Initial guess for virtualizer; rows are measured after render */
const ROW_ESTIMATE_H = 88;
const TEXT_CELL_MAX_H = "5.5rem";

export type EditorCueRailProps = {
  cues: Cue[];
  bilingual: boolean;
  selectedIndex: number | null;
  onSeek: (ms: number) => void;
  onSelectCue: (index: number) => void;
  className?: string;
};

const findActiveCueIndex = (cues: Cue[], currentTimeMs: number) => {
  return cues.findIndex(
    (c) => currentTimeMs >= c.startMs && currentTimeMs < c.endMs,
  );
};

export const EditorCueRail = ({
  cues,
  bilingual,
  selectedIndex,
  onSeek,
  onSelectCue,
  className,
}: EditorCueRailProps) => {
  const currentTimeMs = usePlayerStore((s) => s.currentTimeMs);
  const playing = usePlayerStore((s) => s.playing);

  const scrollParentRef = useRef<HTMLDivElement>(null);
  const prevActiveRef = useRef<number>(-2);

  const activeIndex = useMemo(
    () => findActiveCueIndex(cues, currentTimeMs),
    [cues, currentTimeMs],
  );

  const virtualizer = useVirtualizer({
    count: cues.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => ROW_ESTIMATE_H,
    overscan: 8,
  });

  useEffect(() => {
    if (!playing) {
      prevActiveRef.current = activeIndex;
      return;
    }
    if (activeIndex < 0) {
      prevActiveRef.current = activeIndex;
      return;
    }
    if (activeIndex === prevActiveRef.current) return;
    prevActiveRef.current = activeIndex;
    virtualizer.scrollToIndex(activeIndex, { align: "center" });
  }, [activeIndex, playing, virtualizer]);

  const handleCueActivate = (index: number, startMs: number) => {
    onSelectCue(index);
    onSeek(startMs);
    virtualizer.scrollToIndex(index, { align: "center" });
  };

  if (cues.length === 0) {
    return (
      <p
        className={cn(
          "flex flex-1 items-center px-4 py-8 text-center text-xs text-muted-foreground",
          className,
        )}
      >
        Transcribe the video to fill this list. Times and text will track
        playback.
      </p>
    );
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
          const cue = cues[vi.index];
          if (!cue) return null;
          const isPlayhead = activeIndex === vi.index;
          const isSelected = selectedIndex === vi.index;
          const translation =
            cue.translatedText && cue.translatedText.trim().length > 0
              ? cue.translatedText
              : "—";

          const handleActivate = () => {
            handleCueActivate(vi.index, cue.startMs);
          };

          const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleActivate();
            }
          };

          return (
            <div
              key={cue.id}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 z-0 w-full overflow-hidden border-b border-border bg-card/40"
              style={{
                transform: `translateY(${vi.start}px)`,
              }}
              role="listitem"
            >
              <div
                className={cn(
                  "relative flex cursor-pointer flex-col gap-1 px-3 py-2 pl-4 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring",
                  isPlayhead && "z-[1] bg-signal-muted",
                  isSelected && !isPlayhead && "z-[1] bg-muted/60 ring-1 ring-ring/30",
                )}
                role="button"
                tabIndex={0}
                aria-current={isPlayhead ? "true" : undefined}
                aria-label={`Cue ${vi.index + 1}, ${formatMsHms(cue.startMs)} to ${formatMsHms(cue.endMs)}. Activate to seek.`}
                onClick={handleActivate}
                onKeyDown={handleKeyDown}
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 w-[3px] transition-colors",
                    isPlayhead ? "bg-signal" : isSelected ? "bg-foreground/40" : "bg-transparent",
                  )}
                  aria-hidden
                />
                <p className="shrink-0 font-mono text-[0.6rem] leading-tight text-muted-foreground">
                  <span className={cn("font-semibold", isPlayhead ? "text-signal" : "text-foreground/90")}>
                    {formatMsHms(cue.startMs)}
                  </span>
                  <span className="px-0.5 text-muted-foreground">→</span>
                  <span className="text-foreground/90">
                    {formatMsHms(cue.endMs)}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="min-w-0 overflow-hidden rounded-none border border-transparent bg-background/50 px-1.5 py-1 text-left hover:border-border">
                    <span className="mb-0.5 block shrink-0 text-[0.55rem] font-medium uppercase tracking-wide text-muted-foreground">
                      Transcribed
                    </span>
                    <div
                      className="overflow-y-auto overscroll-contain"
                      style={{ maxHeight: TEXT_CELL_MAX_H }}
                    >
                      <p className="wrap-break-word whitespace-pre-wrap text-[0.7rem] leading-snug text-foreground">
                        {cue.text || "…"}
                      </p>
                    </div>
                    </div>
                  <div className="min-w-0 overflow-hidden rounded-none border border-transparent bg-background/50 px-1.5 py-1 text-left hover:border-border">
                    <span className="mb-0.5 block shrink-0 text-[0.55rem] font-medium uppercase tracking-wide text-muted-foreground">
                      {bilingual ? "Translated" : "Translation"}
                    </span>
                    <div
                      className="overflow-y-auto overscroll-contain"
                      style={{ maxHeight: TEXT_CELL_MAX_H }}
                    >
                      <p className="wrap-break-word whitespace-pre-wrap text-[0.7rem] leading-snug text-foreground/85">
                        {translation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
