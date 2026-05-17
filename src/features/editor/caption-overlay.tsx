import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react"

import {
  clampCaptionPosition,
  type CaptionPosition,
} from "@/features/editor/caption-position"
import {
  clampCaptionFontSizePx,
  clampCaptionMaxWidthPercent,
} from "@/features/editor/caption-size"
import {
  hexToRgba,
  normalizeHexColor,
  type CaptionColors,
} from "@/lib/caption-colors"
import { cn } from "@/lib/utils"
import {
  captionPrimaryText,
  captionSecondaryText,
  type CaptionTextMode,
} from "@/features/editor/caption-text-mode"
import type { Cue } from "@/types/voxia"

export const CAPTION_FONT_PRESETS: { label: string; value: string }[] = [
  { label: "App mono (JetBrains)", value: "'JetBrains Mono Variable', ui-monospace, monospace" },
  { label: "System UI", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Rounded UI", value: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" },
]

type GrabOffset = { dx: number; dy: number }

type ResizeHandle = "se" | "e"

type ResizeSession = {
  handle: ResizeHandle
  centerX: number
  boundsWidth: number
  startWidthPx: number
  startFontSizePx: number
  startMaxWidthPercent: number
}

type ResizePreview = {
  fontSizePx: number
  maxWidthPercent: number
}

type CaptionOverlayProps = {
  cues: Cue[]
  currentTimeMs: number
  textMode: CaptionTextMode
  fontSizePx: number
  maxWidthPercent: number
  fontFamily: string
  position: CaptionPosition
  colors: CaptionColors
  /** Bounding element for drag/resize math (video wrapper). */
  boundsRef: RefObject<HTMLElement | null>
  /** When true, user can drag (and keyboard-nudge) to move captions. */
  draggable?: boolean
  /** When true, user can resize via handles on the caption box. */
  resizable?: boolean
  onPositionChange?: (next: CaptionPosition) => void
  onFontSizeChange?: (px: number) => void
  onMaxWidthPercentChange?: (percent: number) => void
  className?: string
}

const MIN_PANEL_WIDTH_PX = 80

export const CaptionOverlay = ({
  cues,
  currentTimeMs,
  textMode,
  fontSizePx,
  maxWidthPercent,
  fontFamily,
  position,
  colors,
  boundsRef,
  draggable = false,
  resizable = false,
  onPositionChange,
  onFontSizeChange,
  onMaxWidthPercentChange,
  className,
}: CaptionOverlayProps) => {
  const active = useMemo(() => {
    return cues.find((c) => currentTimeMs >= c.startMs && currentTimeMs < c.endMs)
  }, [cues, currentTimeMs])

  const activePrimaryText = active ? captionPrimaryText(active, textMode) : null
  const activeSecondaryText = active ? captionSecondaryText(active, textMode) : null

  const textHex = normalizeHexColor(colors.textColor, colors.textColor)
  const bgHex = normalizeHexColor(colors.backgroundColor, colors.backgroundColor)
  const panelBg = hexToRgba(bgHex, colors.backgroundOpacity)

  const panelRef = useRef<HTMLDivElement>(null)
  const grabOffsetRef = useRef<GrabOffset | null>(null)
  const pendingPosRef = useRef<CaptionPosition | null>(null)
  const resizeSessionRef = useRef<ResizeSession | null>(null)
  const pendingResizeRef = useRef<ResizePreview | null>(null)

  const [dragPreview, setDragPreview] = useState<CaptionPosition | null>(null)
  const [resizePreview, setResizePreview] = useState<ResizePreview | null>(null)
  const [isResizing, setIsResizing] = useState(false)

  const displayPosition = dragPreview ?? position
  const displayFontSizePx = resizePreview?.fontSizePx ?? fontSizePx
  const displayMaxWidthPercent = resizePreview?.maxWidthPercent ?? maxWidthPercent

  const typography: CSSProperties = {
    fontFamily,
    fontSize: `${displayFontSizePx}px`,
    lineHeight: 1.35,
    color: textHex,
  }

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!draggable || !onPositionChange || resizeSessionRef.current) return
    if ((e.target as HTMLElement).dataset.resizeHandle) return
    const rect = boundsRef.current?.getBoundingClientRect()
    if (!rect || rect.width < 1 || rect.height < 1) return
    e.preventDefault()
    e.stopPropagation()
    const px = ((e.clientX - rect.left) / rect.width) * 100
    const py = ((e.clientY - rect.top) / rect.height) * 100
    const anchor = dragPreview ?? position
    grabOffsetRef.current = {
      dx: px - anchor.xPercent,
      dy: py - anchor.yPercent,
    }
    pendingPosRef.current = anchor
    setDragPreview(anchor)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (resizeSessionRef.current && resizable) {
      const session = resizeSessionRef.current
      const halfWidth = Math.max(MIN_PANEL_WIDTH_PX / 2, e.clientX - session.centerX)
      const newWidthPx = halfWidth * 2
      const nextWidthPercent = clampCaptionMaxWidthPercent(
        (newWidthPx / session.boundsWidth) * 100,
      )
      let nextFont = session.startFontSizePx
      if (session.handle === "se") {
        const scale = newWidthPx / Math.max(session.startWidthPx, MIN_PANEL_WIDTH_PX)
        nextFont = clampCaptionFontSizePx(session.startFontSizePx * scale)
      }
      const next = { fontSizePx: nextFont, maxWidthPercent: nextWidthPercent }
      pendingResizeRef.current = next
      setResizePreview(next)
      return
    }

    if (!grabOffsetRef.current || !draggable || !onPositionChange) return
    const rect = boundsRef.current?.getBoundingClientRect()
    if (!rect || rect.width < 1 || rect.height < 1) return
    const px = ((e.clientX - rect.left) / rect.width) * 100
    const py = ((e.clientY - rect.top) / rect.height) * 100
    const g = grabOffsetRef.current
    const next = clampCaptionPosition(px - g.dx, py - g.dy)
    pendingPosRef.current = next
    setDragPreview(next)
  }

  const finishPointer = (e: PointerEvent<HTMLDivElement>) => {
    const captureEl = panelRef.current ?? e.currentTarget
    if (resizeSessionRef.current) {
      resizeSessionRef.current = null
      setIsResizing(false)
      setResizePreview(null)
      try {
        captureEl.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
      const committed = pendingResizeRef.current
      pendingResizeRef.current = null
      if (committed) {
        onMaxWidthPercentChange?.(committed.maxWidthPercent)
        if (committed.fontSizePx !== fontSizePx) {
          onFontSizeChange?.(committed.fontSizePx)
        }
      }
      return
    }

    if (!grabOffsetRef.current) return
    grabOffsetRef.current = null
    setDragPreview(null)
    try {
      captureEl.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    const committed = pendingPosRef.current
    pendingPosRef.current = null
    if (committed && onPositionChange) {
      onPositionChange(committed)
    }
  }

  const handleResizePointerDown = (
    e: PointerEvent<HTMLSpanElement>,
    handle: ResizeHandle,
  ) => {
    if (!resizable || !onMaxWidthPercentChange) return
    const bounds = boundsRef.current?.getBoundingClientRect()
    const panel = panelRef.current?.getBoundingClientRect()
    if (!bounds || bounds.width < 1 || !panel) return
    e.preventDefault()
    e.stopPropagation()
    const centerX = panel.left + panel.width / 2
    setIsResizing(true)
    panelRef.current?.setPointerCapture(e.pointerId)
    resizeSessionRef.current = {
      handle,
      centerX,
      boundsWidth: bounds.width,
      startWidthPx: panel.width,
      startFontSizePx: fontSizePx,
      startMaxWidthPercent: maxWidthPercent,
    }
    pendingResizeRef.current = {
      fontSizePx,
      maxWidthPercent,
    }
    setResizePreview({ fontSizePx, maxWidthPercent })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!draggable || !onPositionChange) return
    let dx = 0
    let dy = 0
    if (e.key === "ArrowLeft") dx = -1
    else if (e.key === "ArrowRight") dx = 1
    else if (e.key === "ArrowUp") dy = -1
    else if (e.key === "ArrowDown") dy = 1
    else return
    e.preventDefault()
    onPositionChange(clampCaptionPosition(position.xPercent + dx, position.yPercent + dy))
  }

  const panelStyle: CSSProperties = {
    left: `${displayPosition.xPercent}%`,
    top: `${displayPosition.yPercent}%`,
    transform: "translate3d(-50%, -50%, 0)",
    transformOrigin: "center center",
    width: `${displayMaxWidthPercent}%`,
    maxWidth: "100%",
    backgroundColor: panelBg,
    borderColor: hexToRgba(bgHex, Math.min(1, colors.backgroundOpacity + 0.15)),
  }

  const showHandles = resizable && (onMaxWidthPercentChange != null)

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-10 overflow-hidden", className)}>
      <div
        ref={panelRef}
        className={cn(
          "group pointer-events-auto absolute max-h-[min(40vh,14rem)] overflow-x-hidden overflow-y-auto rounded-md border px-3 py-2 text-center shadow-lg backdrop-blur-sm will-change-transform",
          draggable && !isResizing
            ? "cursor-grab touch-none active:cursor-grabbing"
            : "",
          resizable ? "select-none" : "",
        )}
        style={panelStyle}
        tabIndex={draggable || resizable ? 0 : undefined}
        aria-label={
          draggable || resizable
            ? `Caption preview. ${Math.round(displayPosition.xPercent)}% horizontal, ${Math.round(displayPosition.yPercent)}% vertical. ${displayFontSizePx}px font, ${Math.round(displayMaxWidthPercent)}% width. Drag to move${showHandles ? ", drag handles to resize" : ""}.`
            : undefined
        }
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onKeyDown={handleKeyDown}
      >
        {active ? (
          <div
            className="text-balance wrap-break-word drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
            style={typography}
            role="status"
            aria-live="polite"
            aria-relevant="text"
          >
            <p className="wrap-break-word font-semibold">{activePrimaryText}</p>
            {activeSecondaryText ? (
              <p
                className="mt-1 wrap-break-word border-t pt-1 opacity-90"
                style={{
                  ...typography,
                  fontSize: `${Math.max(10, displayFontSizePx - 2)}px`,
                  borderColor: hexToRgba(textHex, 0.2),
                }}
              >
                {activeSecondaryText}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-balance font-medium" style={{ ...typography, opacity: 0.85 }} role="note">
            Caption preview
          </p>
        )}
        {showHandles ? (
          <>
            <span
              data-resize-handle="e"
              className="absolute top-1/2 right-0 z-20 h-8 w-2 -translate-y-1/2 cursor-ew-resize touch-none rounded-sm bg-primary/70 opacity-60 transition-opacity hover:opacity-100 group-hover:opacity-100"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize caption width"
              onPointerDown={(e) => handleResizePointerDown(e, "e")}
            />
            <span
              data-resize-handle="se"
              className="absolute right-0 bottom-0 z-20 size-3.5 cursor-se-resize touch-none rounded-sm border border-primary-foreground/30 bg-primary shadow-sm"
              role="separator"
              aria-label="Resize caption width and text size"
              onPointerDown={(e) => handleResizePointerDown(e, "se")}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
