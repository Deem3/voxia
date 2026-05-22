import { useCallback, useEffect } from "react"

import { useEditorStore } from "@/store/useEditorStore"
import { usePlayerStore } from "@/store/usePlayerStore"

const SEEK_STEP_MS = 5000

const isTypingTarget = (el: Element | null): boolean =>
  !!el &&
  (el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.getAttribute("contenteditable") === "true")

type Args = {
  selectedIndex: number | null
  setSelectedIndex: (
    next: number | null | ((prev: number | null) => number | null),
  ) => void
}

/**
 * Wire up the editor's global keyboard shortcuts:
 * - ⌘/Ctrl+Z / Shift+⌘/Ctrl+Z — undo / redo (active even while typing).
 * - Space — toggle play, J/L — ±5s, K — pause.
 * - Enter — split selected cue at playhead.
 * - Backspace — merge selected cue with previous.
 * - Tab — move selection to next cue.
 *
 * Shortcuts (other than undo/redo) are skipped when focus is in a text input.
 */
export const useEditorKeyboardShortcuts = ({
  selectedIndex,
  setSelectedIndex,
}: Args) => {
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const splitCueAt = useEditorStore((s) => s.splitCueAt)
  const mergeWithPrevious = useEditorStore((s) => s.mergeWithPrevious)

  const setCurrentTimeMs = usePlayerStore((s) => s.setCurrentTimeMs)
  const setPlaying = usePlayerStore((s) => s.setPlaying)

  const advanceCue = useCallback(() => {
    const project = useEditorStore.getState().project
    if (!project || project.cues.length === 0) return
    setSelectedIndex((i) => {
      if (i === null) return 0
      return Math.min(project.cues.length - 1, i + 1)
    })
  }, [setSelectedIndex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Undo/redo first — works even while typing in inputs.
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(document.activeElement)) return

      if (e.key === " " || e.code === "Space") {
        e.preventDefault()
        const st = usePlayerStore.getState()
        setPlaying(!st.playing)
        return
      }
      if (e.key === "j" || e.key === "J") {
        e.preventDefault()
        const st = usePlayerStore.getState()
        setCurrentTimeMs(Math.max(0, st.currentTimeMs - SEEK_STEP_MS))
        return
      }
      if (e.key === "l" || e.key === "L") {
        e.preventDefault()
        const st = usePlayerStore.getState()
        const d = st.durationMs
        const proposed = st.currentTimeMs + SEEK_STEP_MS
        setCurrentTimeMs(Math.min(d > 0 ? d : proposed, proposed))
        return
      }
      if (e.key === "k" || e.key === "K") {
        e.preventDefault()
        setPlaying(false)
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        if (selectedIndex !== null) {
          const t = usePlayerStore.getState().currentTimeMs
          splitCueAt(selectedIndex, t)
        }
        return
      }
      if (e.key === "Backspace") {
        e.preventDefault()
        if (selectedIndex !== null && selectedIndex > 0) {
          mergeWithPrevious(selectedIndex)
          setSelectedIndex((i) => (i === null ? null : Math.max(0, i - 1)))
        }
        return
      }
      if (e.key === "Tab") {
        e.preventDefault()
        advanceCue()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [
    advanceCue,
    mergeWithPrevious,
    redo,
    selectedIndex,
    setCurrentTimeMs,
    setPlaying,
    setSelectedIndex,
    splitCueAt,
    undo,
  ])
}
