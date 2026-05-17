import { Pause, Play, Rewind, FastForward } from "@phosphor-icons/react"
import { useEffect, useRef } from "react"

import { CaptionOverlay } from "@/features/editor/caption-overlay"
import type { CaptionTextMode } from "@/features/editor/caption-text-mode"
import type { CaptionPosition } from "@/features/editor/caption-position"
import type { CaptionColors } from "@/lib/caption-colors"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { usePlayerStore } from "@/store/usePlayerStore"
import type { Cue } from "@/types/voxia"

type VideoPanelProps = {
  videoSrc: string
  cues: Cue[]
  captionTextMode: CaptionTextMode
  captionFontSizePx: number
  captionMaxWidthPercent: number
  captionFontFamily: string
  captionPosition: CaptionPosition
  captionColors: CaptionColors
  captionPositionDraggable?: boolean
  onCaptionPositionChange?: (next: CaptionPosition) => void
  onCaptionFontSizeChange?: (px: number) => void
  onCaptionMaxWidthChange?: (percent: number) => void
}

const FRAME_MS = Math.round(1000 / 24)

export const VideoPanel = ({
  videoSrc,
  cues,
  captionTextMode,
  captionFontSizePx,
  captionMaxWidthPercent,
  captionFontFamily,
  captionPosition,
  captionColors,
  captionPositionDraggable = false,
  onCaptionPositionChange,
  onCaptionFontSizeChange,
  onCaptionMaxWidthChange,
}: VideoPanelProps) => {
  const ref = useRef<HTMLVideoElement>(null)
  const boundsRef = useRef<HTMLDivElement>(null)
  const { currentTimeMs, durationMs, playing, setCurrentTimeMs, setDurationMs, setPlaying } =
    usePlayerStore()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (playing) {
      void el.play().catch(() => setPlaying(false))
    } else {
      el.pause()
    }
  }, [playing, setPlaying])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const diff = Math.abs(el.currentTime * 1000 - currentTimeMs)
    if (diff > 120) {
      el.currentTime = currentTimeMs / 1000
    }
  }, [currentTimeMs])

  const handleTimeUpdate = () => {
    const el = ref.current
    if (!el) return
    setCurrentTimeMs(Math.round(el.currentTime * 1000))
  }

  const handleLoaded = () => {
    const el = ref.current
    if (!el) return
    setDurationMs(Math.round((el.duration || 0) * 1000))
  }

  const seek = (ms: number) => {
    const el = ref.current
    if (!el) return
    const next = Math.max(0, Math.min(durationMs || Number.MAX_SAFE_INTEGER, ms))
    el.currentTime = next / 1000
    setCurrentTimeMs(next)
  }

  const handleTogglePlay = () => {
    setPlaying(!playing)
  }

  const handleSlider = (v: number[]) => {
    const n = v[0]
    if (n === undefined) return
    seek(n)
  }

  return (
    <div className="space-y-3 rounded-none border border-border bg-muted/30 p-3">
      <div ref={boundsRef} className="relative overflow-hidden rounded-none border border-border bg-black">
        <video
          ref={ref}
          src={videoSrc}
          className="aspect-video w-full object-contain"
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoaded}
          onEnded={() => setPlaying(false)}
          controls={false}
        />
        <CaptionOverlay
          cues={cues}
          currentTimeMs={currentTimeMs}
          textMode={captionTextMode}
          fontSizePx={captionFontSizePx}
          maxWidthPercent={captionMaxWidthPercent}
          fontFamily={captionFontFamily}
          position={captionPosition}
          colors={captionColors}
          boundsRef={boundsRef}
          draggable={captionPositionDraggable}
          resizable={captionPositionDraggable}
          onPositionChange={onCaptionPositionChange}
          onFontSizeChange={onCaptionFontSizeChange}
          onMaxWidthPercentChange={onCaptionMaxWidthChange}
        />
      </div>
      {captionPositionDraggable ? (
        <p className="text-[0.65rem] text-muted-foreground">
          Drag the caption block to move it. Use the right edge or bottom-right handle to resize width and text size
          (arrow keys when focused). Changes apply to this project; global defaults live in Settings.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="icon-sm" variant="secondary" onClick={handleTogglePlay} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause className="size-4" weight="duotone" aria-hidden /> : <Play className="size-4" weight="duotone" aria-hidden />}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => seek(usePlayerStore.getState().currentTimeMs - 5000)} aria-label="Back 5 seconds">
          <Rewind className="size-4" weight="duotone" aria-hidden />
          <span className="sr-only">-5s</span>
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => seek(usePlayerStore.getState().currentTimeMs + 5000)} aria-label="Forward 5 seconds">
          <FastForward className="size-4" weight="duotone" aria-hidden />
          <span className="sr-only">+5s</span>
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => seek(usePlayerStore.getState().currentTimeMs - FRAME_MS)} aria-label="Previous frame">
          −f
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => seek(usePlayerStore.getState().currentTimeMs + FRAME_MS)} aria-label="Next frame">
          +f
        </Button>
        <div className="min-w-[120px] flex-1 px-1">
          <Slider
            value={[Math.min(currentTimeMs, Math.max(durationMs, 1))]}
            max={Math.max(durationMs, 1)}
            step={1}
            onValueChange={handleSlider}
            aria-label="Seek timeline"
          />
        </div>
      </div>
    </div>
  )
}
