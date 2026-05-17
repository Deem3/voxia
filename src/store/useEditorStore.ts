import { create } from "zustand"

import { clampCaptionPosition, type CaptionPosition } from "@/features/editor/caption-position"
import {
  clampCaptionFontSizePx,
  clampCaptionMaxWidthPercent,
} from "@/features/editor/caption-size"
import {
  clampCaptionBackgroundOpacity,
  normalizeHexColor,
} from "@/lib/caption-colors"
import { readProject, saveProject } from "@/lib/commands"
import type { Cue, VoxiaProject } from "@/types/voxia"

const DEBOUNCE_MS = 500
const MAX_UNDO = 100

const clone = (p: VoxiaProject): VoxiaProject => JSON.parse(JSON.stringify(p)) as VoxiaProject

type EditorState = {
  projectPath: string | null
  project: VoxiaProject | null
  undoStack: VoxiaProject[]
  redoStack: VoxiaProject[]
  saveTimer: ReturnType<typeof setTimeout> | null
  load: (path: string) => Promise<void>
  reset: () => void
  pushUndo: () => void
  setProject: (p: VoxiaProject) => void
  setProjectCaptionFontSizePx: (value: number | null) => void
  setProjectCaptionMaxWidthPercent: (value: number | null) => void
  setProjectCaptionFontFamily: (value: string | null) => void
  setProjectCaptionPosition: (value: CaptionPosition) => void
  setProjectCaptionTextColor: (value: string | null) => void
  setProjectCaptionBackgroundColor: (value: string | null) => void
  setProjectCaptionBackgroundOpacity: (value: number | null) => void
  clearProjectCaptionAppearance: () => void
  setCueText: (index: number, text: string) => void
  setCueTranslatedText: (index: number, text: string) => void
  setCueTimes: (index: number, startMs: number, endMs: number) => void
  splitCueAt: (index: number, splitMs: number) => void
  mergeWithPrevious: (index: number) => void
  undo: () => void
  redo: () => void
  scheduleSave: () => void
  saveNow: () => Promise<void>
}

export const useEditorStore = create<EditorState>((set, get) => ({
  projectPath: null,
  project: null,
  undoStack: [],
  redoStack: [],
  saveTimer: null,

  reset: () => {
    const t = get().saveTimer
    if (t) clearTimeout(t)
    set({
      projectPath: null,
      project: null,
      undoStack: [],
      redoStack: [],
      saveTimer: null,
    })
  },

  load: async (path) => {
    const proj = await readProject(path)
    set({
      projectPath: path,
      project: proj,
      undoStack: [],
      redoStack: [],
      saveTimer: null,
    })
  },

  pushUndo: () => {
    const { project, undoStack } = get()
    if (!project) return
    const next = [...undoStack, clone(project)]
    const trimmed =
      next.length > MAX_UNDO ? next.slice(next.length - MAX_UNDO) : next
    set({ undoStack: trimmed, redoStack: [] })
  },

  setProject: (p) => set({ project: p }),

  setProjectCaptionFontSizePx: (value) => {
    const { project, scheduleSave } = get()
    if (!project) return
    const next =
      value === null ? null : clampCaptionFontSizePx(Number(value))
    set({
      project: {
        ...project,
        captionFontSizePx: next,
      },
    })
    scheduleSave()
  },

  setProjectCaptionMaxWidthPercent: (value) => {
    const { project, scheduleSave } = get()
    if (!project) return
    const next =
      value === null ? null : clampCaptionMaxWidthPercent(Number(value))
    set({
      project: {
        ...project,
        captionMaxWidthPercent: next,
      },
    })
    scheduleSave()
  },

  setProjectCaptionFontFamily: (value) => {
    const { project, scheduleSave } = get()
    if (!project) return
    const next =
      value === null
        ? null
        : value.trim() === ""
          ? null
          : value.trim()
    set({
      project: {
        ...project,
        captionFontFamily: next,
      },
    })
    scheduleSave()
  },

  setProjectCaptionPosition: (value) => {
    const { project, scheduleSave } = get()
    if (!project) return
    const c = clampCaptionPosition(value.xPercent, value.yPercent)
    set({
      project: {
        ...project,
        captionPositionXPercent: c.xPercent,
        captionPositionYPercent: c.yPercent,
        captionVerticalAlign: null,
      },
    })
    scheduleSave()
  },

  setProjectCaptionTextColor: (value) => {
    const { project, scheduleSave } = get()
    if (!project) return
    const next =
      value === null || (typeof value === "string" && value.trim() === "")
        ? null
        : normalizeHexColor(value, "#ffffff")
    set({
      project: {
        ...project,
        captionTextColor: next,
      },
    })
    scheduleSave()
  },

  setProjectCaptionBackgroundColor: (value) => {
    const { project, scheduleSave } = get()
    if (!project) return
    const next =
      value === null || (typeof value === "string" && value.trim() === "")
        ? null
        : normalizeHexColor(value, "#000000")
    set({
      project: {
        ...project,
        captionBackgroundColor: next,
      },
    })
    scheduleSave()
  },

  setProjectCaptionBackgroundOpacity: (value) => {
    const { project, scheduleSave } = get()
    if (!project) return
    const next = value === null || !Number.isFinite(Number(value)) ? null : clampCaptionBackgroundOpacity(Number(value))
    set({
      project: {
        ...project,
        captionBackgroundOpacity: next,
      },
    })
    scheduleSave()
  },

  clearProjectCaptionAppearance: () => {
    const { project, scheduleSave } = get()
    if (!project) return
    set({
      project: {
        ...project,
        captionFontSizePx: null,
        captionMaxWidthPercent: null,
        captionFontFamily: null,
        captionPositionXPercent: null,
        captionPositionYPercent: null,
        captionTextColor: null,
        captionBackgroundColor: null,
        captionBackgroundOpacity: null,
        captionVerticalAlign: null,
      },
    })
    scheduleSave()
  },

  setCueText: (index, text) => {
    const { project, scheduleSave } = get()
    if (!project) return
    const cue = project.cues[index]
    if (!cue) return
    const cues = project.cues.map((c, i) =>
      i === index ? { ...c, text } : c,
    )
    set({ project: { ...project, cues } })
    scheduleSave()
  },

  setCueTranslatedText: (index, text) => {
    const { project, scheduleSave } = get()
    if (!project) return
    const cue = project.cues[index]
    if (!cue) return
    const trimmed = text.trim()
    const translatedText = trimmed.length > 0 ? trimmed : null
    const cues = project.cues.map((c, i) =>
      i === index ? { ...c, translatedText } : c,
    )
    set({ project: { ...project, cues } })
    scheduleSave()
  },

  setCueTimes: (index, startMs, endMs) => {
    const { project, pushUndo, scheduleSave } = get()
    if (!project) return
    const cue = project.cues[index]
    if (!cue) return
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs >= endMs) return
    const prev = index > 0 ? project.cues[index - 1] : undefined
    const next = project.cues[index + 1]
    if (prev && startMs < prev.endMs) return
    if (next && endMs > next.startMs) return
    pushUndo()
    const cues = project.cues.map((c, i) =>
      i === index ? { ...c, startMs, endMs } : c,
    )
    set({ project: { ...project, cues } })
    scheduleSave()
  },

  splitCueAt: (index, splitMs) => {
    const { project, pushUndo, scheduleSave } = get()
    if (!project) return
    const cue = project.cues[index]
    if (!cue) return
    if (splitMs <= cue.startMs || splitMs >= cue.endMs) return
    pushUndo()
    const left: Cue = {
      ...cue,
      id: crypto.randomUUID(),
      endMs: splitMs,
    }
    const right: Cue = {
      ...cue,
      id: crypto.randomUUID(),
      startMs: splitMs,
      text: "",
      translatedText: null,
    }
    const cues = [...project.cues]
    cues.splice(index, 1, left, right)
    set({ project: { ...project, cues } })
    scheduleSave()
  },

  mergeWithPrevious: (index) => {
    const { project, pushUndo, scheduleSave } = get()
    if (!project || index <= 0) return
    const prev = project.cues[index - 1]
    const cur = project.cues[index]
    if (!prev || !cur) return
    pushUndo()
    const merged: Cue = {
      ...prev,
      endMs: cur.endMs,
      text: `${prev.text} ${cur.text}`.trim(),
      translatedText: (() => {
        const a = prev.translatedText ?? ""
        const b = cur.translatedText ?? ""
        const t = `${a} ${b}`.trim()
        return t.length > 0 ? t : null
      })(),
    }
    const cues = [...project.cues]
    cues.splice(index - 1, 2, merged)
    set({ project: { ...project, cues } })
    scheduleSave()
  },

  undo: () => {
    const { project, undoStack, redoStack, projectPath } = get()
    if (!project || undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    if (!prev) return
    const newUndo = undoStack.slice(0, -1)
    set({
      project: prev,
      undoStack: newUndo,
      redoStack: [...redoStack, clone(project)],
    })
    if (projectPath) void saveProject(projectPath, prev).catch(console.error)
  },

  redo: () => {
    const { project, redoStack, undoStack, projectPath } = get()
    if (!project || redoStack.length === 0) return
    const nxt = redoStack[redoStack.length - 1]
    if (!nxt) return
    const newRedo = redoStack.slice(0, -1)
    set({
      project: nxt,
      redoStack: newRedo,
      undoStack: [...undoStack, clone(project)],
    })
    if (projectPath) void saveProject(projectPath, nxt).catch(console.error)
  },

  scheduleSave: () => {
    const { saveTimer, projectPath, project } = get()
    if (saveTimer) clearTimeout(saveTimer)
    if (!projectPath || !project) return
    const timer = setTimeout(() => {
      void saveProject(projectPath, project).catch(console.error)
      set({ saveTimer: null })
    }, DEBOUNCE_MS)
    set({ saveTimer: timer })
  },

  saveNow: async () => {
    const { saveTimer, projectPath, project } = get()
    if (saveTimer) clearTimeout(saveTimer)
    if (!projectPath || !project) return
    await saveProject(projectPath, project)
    set({ saveTimer: null })
  },
}))
