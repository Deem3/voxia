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
        "flex w-full shrink-0 flex-col overflow-hidden rounded-none border border-border bg-card/40 lg:w-[min(100%,20rem)]",
        panelStyle == null && "max-h-[min(50vh,28rem)] lg:max-h-[min(70vh,42rem)]",
      )}
      style={panelStyle}
      aria-label="Caption tracking beside video"
    >
      <header className="shrink-0 border-b border-border bg-card/60 px-3 py-2.5">
        <p className="flex items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-foreground">
          <span className="inline-flex h-1 w-3 bg-signal" aria-hidden />
          Caption tracking
        </p>
        <p className="mt-1 truncate text-[0.65rem] text-muted-foreground">
          {cues.length === 0
            ? "Transcribe to see lines here"
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
