import {
  PauseIcon as Pause,
  PlayIcon as Play,
  RewindIcon as Rewind,
  FastForwardIcon as FastForward,
} from "@phosphor-icons/react"
import { useEffect, useRef } from "react"

import { CaptionOverlay } from "@/features/editor/caption-overlay"
import type { CaptionTextMode } from "@/features/editor/caption-text-mode"
import type { CaptionPosition } from "@/features/editor/caption-position"
import type { CaptionColors } from "@/lib/caption-colors"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { usePlayerStore } from "@/store/usePlayerStore"
import { cn } from "@/lib/utils"
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
    if (diff > 50) {
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

  const handleSlider = (v: number[]) => {
    const n = v[0]
    if (n === undefined) return
    seek(n)
  }

  const progress = durationMs > 0 ? (currentTimeMs / durationMs) * 100 : 0

  return (
    <div className={cn(
      "overflow-hidden border border-border/70 bg-black/95",
      "shadow-[0_4px_24px_color-mix(in_oklab,var(--foreground)_8%,transparent)]",
      "transition-shadow duration-200",
    )}>
      {/* Video container */}
      <div ref={boundsRef} className="relative overflow-hidden bg-black">
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

      {/* Thin progress bar */}
      <div className="relative h-0.5 w-full bg-white/5 group/timeline cursor-pointer hover:h-1 transition-all duration-150">
        <div
          className="h-full bg-signal transition-[width] duration-100"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
        <Slider
          value={[Math.min(currentTimeMs, Math.max(durationMs, 1))]}
          max={Math.max(durationMs, 1)}
          step={1}
          onValueChange={handleSlider}
          aria-label="Seek timeline"
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 bg-card/20 px-3 py-2 backdrop-blur-sm">
        {/* Play/Pause */}
        <Button
          type="button"
          size="icon-sm"
          variant={playing ? "signal" : "ghost"}
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? "Pause" : "Play"}
          title={playing ? "Pause (Space)" : "Play (Space)"}
          className={cn(
            "transition-all duration-150",
            playing && "signal-glow-sm",
          )}
        >
          {playing
            ? <Pause className="size-3.5" weight="fill" aria-hidden />
            : <Play className="size-3.5" weight="fill" aria-hidden />}
        </Button>

        {/* Skip ±5s */}
        <div className="flex items-center gap-px border border-border/50 bg-black/20 p-0.5">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => seek(usePlayerStore.getState().currentTimeMs - 5000)}
            aria-label="Back 5 seconds"
            title="Back 5s (J)"
            className="text-muted-foreground hover:text-foreground"
          >
            <Rewind className="size-3.5" weight="duotone" aria-hidden />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => seek(usePlayerStore.getState().currentTimeMs + 5000)}
            aria-label="Forward 5 seconds"
            title="Forward 5s (L)"
            className="text-muted-foreground hover:text-foreground"
          >
            <FastForward className="size-3.5" weight="duotone" aria-hidden />
          </Button>
        </div>

        {/* Frame step */}
        <div className="flex items-center gap-px border border-border/50 bg-black/20 p-0.5">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => seek(usePlayerStore.getState().currentTimeMs - FRAME_MS)}
            aria-label="Previous frame"
            title="Previous frame"
            className="font-mono text-[0.55rem] font-semibold text-muted-foreground hover:text-foreground w-7"
          >
            −f
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => seek(usePlayerStore.getState().currentTimeMs + FRAME_MS)}
            aria-label="Next frame"
            title="Next frame"
            className="font-mono text-[0.55rem] font-semibold text-muted-foreground hover:text-foreground w-7"
          >
            +f
          </Button>
        </div>

        {/* Timecode */}
        <span className="ml-1 font-mono text-[0.6rem] tabular-nums text-muted-foreground/70 select-none">
          <span className="text-foreground/90 font-semibold">{formatTimeMs(currentTimeMs)}</span>
          <span className="mx-1 opacity-40">/</span>
          <span>{formatTimeMs(durationMs)}</span>
        </span>

        {/* Seek slider (desktop) */}
        <div className="hidden min-w-[120px] flex-1 md:block">
          <Slider
            value={[Math.min(currentTimeMs, Math.max(durationMs, 1))]}
            max={Math.max(durationMs, 1)}
            step={1}
            onValueChange={handleSlider}
            aria-label="Seek"
          />
        </div>
      </div>

      {/* Drag hint */}
      {captionPositionDraggable ? (
        <p className="border-t border-border/30 bg-muted/10 px-3 py-1.5 text-[0.58rem] text-muted-foreground/60">
          Drag caption to move · right edge or corner handle to resize · arrow keys when focused
        </p>
      ) : null}
    </div>
  )
}

const formatTimeMs = (ms: number) => {
  if (!Number.isFinite(ms) || ms <= 0) return "0:00"
  const totalSec = Math.round(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => n.toString().padStart(2, "0")
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}
