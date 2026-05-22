import { PauseIcon as Pause, PlayIcon as Play, RewindIcon as Rewind, FastForwardIcon as FastForward } from "@phosphor-icons/react"
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
    <div className="space-y-3 border border-border bg-muted/30 p-3 shadow-[0_0_0_1px_color-mix(in_oklab,var(--signal)_8%,transparent)]">
      <div ref={boundsRef} className="relative overflow-hidden border border-border bg-black">
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
        <Button
          type="button"
          size="icon-sm"
          variant={playing ? "signal" : "default"}
          onClick={handleTogglePlay}
          aria-label={playing ? "Pause" : "Play"}
          title={playing ? "Pause (Space)" : "Play (Space)"}
        >
          {playing ? <Pause className="size-4" weight="fill" aria-hidden /> : <Play className="size-4" weight="fill" aria-hidden />}
        </Button>
        <div className="flex items-center gap-px border border-border bg-card/60 p-0.5">
          <Button type="button" size="icon-sm" variant="ghost" onClick={() => seek(usePlayerStore.getState().currentTimeMs - 5000)} aria-label="Back 5 seconds" title="Back 5s (J)">
            <Rewind className="size-4" weight="duotone" aria-hidden />
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" onClick={() => seek(usePlayerStore.getState().currentTimeMs + 5000)} aria-label="Forward 5 seconds" title="Forward 5s (L)">
            <FastForward className="size-4" weight="duotone" aria-hidden />
          </Button>
        </div>
        <div className="flex items-center gap-px border border-border bg-card/60 p-0.5">
          <Button type="button" size="icon-sm" variant="ghost" onClick={() => seek(usePlayerStore.getState().currentTimeMs - FRAME_MS)} aria-label="Previous frame" title="Previous frame">
            <span className="font-mono text-[0.65rem] font-semibold">−f</span>
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" onClick={() => seek(usePlayerStore.getState().currentTimeMs + FRAME_MS)} aria-label="Next frame" title="Next frame">
            <span className="font-mono text-[0.65rem] font-semibold">+f</span>
          </Button>
        </div>
        <span className="ml-1 font-mono text-[0.65rem] tabular-nums text-muted-foreground">
          <span className="text-foreground">{formatTimeMs(currentTimeMs)}</span>
          <span className="px-1 opacity-60">/</span>
          <span>{formatTimeMs(durationMs)}</span>
        </span>
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

const formatTimeMs = (ms: number) => {
  if (!Number.isFinite(ms) || ms <= 0) return "00:00"
  const totalSec = Math.round(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => n.toString().padStart(2, "0")
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
