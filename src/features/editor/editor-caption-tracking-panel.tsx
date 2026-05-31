import { useEffect, useState } from "react"

import { EditorCueRail } from "@/features/editor/editor-cue-rail"
import { cn } from "@/lib/utils"
import type { Cue } from "@/types/voxia"

type EditorCaptionTrackingPanelProps = {
  cues: Cue[]
  bilingual: boolean
  selectedIndex: number | null
  syncHeightPx?: number | null
  onSeek: (ms: number) => void
  onSelectCue: (index: number) => void
}

export const EditorCaptionTrackingPanel = ({
  cues,
  bilingual,
  selectedIndex,
  syncHeightPx,
  onSeek,
  onSelectCue,
}: EditorCaptionTrackingPanelProps) => {
  const [isLargeLayout, setIsLargeLayout] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const update = () => setIsLargeLayout(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const panelStyle =
    isLargeLayout && syncHeightPx != null && syncHeightPx > 0
      ? { height: syncHeightPx, maxHeight: syncHeightPx }
      : undefined

  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col overflow-hidden",
        "border border-border/60 bg-card/25",
        "lg:w-[min(100%,19rem)]",
        panelStyle == null && "max-h-[min(50vh,28rem)] lg:max-h-[min(70vh,42rem)]",
      )}
      style={panelStyle}
      aria-label="Caption tracking panel"
    >
      {/* Panel header */}
      <header className={cn(
        "shrink-0 px-3 py-2 border-b border-border/50",
        "bg-gradient-to-b from-muted/30 to-transparent",
      )}>
        <p className="flex items-center gap-2 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-foreground/70">
          <span className="inline-block h-[2px] w-3 rounded-full bg-signal" aria-hidden />
          Caption tracking
        </p>
        <p className="mt-0.5 truncate text-[0.6rem] text-muted-foreground/55">
          {cues.length === 0
            ? "Transcribe to see cues"
            : `${cues.length} cue${cues.length === 1 ? "" : "s"} · follows playback · click to seek`}
        </p>
      </header>

      <EditorCueRail
        cues={cues}
        bilingual={bilingual}
        selectedIndex={selectedIndex}
        onSeek={onSeek}
        onSelectCue={onSelectCue}
        className="min-h-0 flex-1"
      />
    </aside>
  )
}
