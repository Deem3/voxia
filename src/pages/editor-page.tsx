"use client"

import { useQuery } from "@tanstack/react-query"
import { getRouteApi } from "@tanstack/react-router"
import { convertFileSrc } from "@tauri-apps/api/core"
import { useCallback, useMemo, useRef, useState } from "react"

import { EditorCaptionTrackingPanel } from "@/features/editor/editor-caption-tracking-panel"
import { EditorCaptionModeToggle } from "@/features/editor/editor-caption-mode-toggle"
import {
  EditorCueDrawer,
} from "@/features/editor/editor-cue-drawer"
import { EditorEmptyState } from "@/features/editor/editor-empty-state"
import { EditorExportDialog } from "@/features/editor/editor-export-dialog"
import { EditorPageHeader } from "@/features/editor/editor-page-header"
import { EditorShortcutsBar } from "@/features/editor/editor-shortcuts-bar"
import { EditorTranscribePanel } from "@/features/editor/editor-transcribe-panel"
import { EditorTranslatePanel } from "@/features/editor/editor-translate-panel"
import { ProjectCaptionAppearanceBar } from "@/features/editor/project-caption-appearance-bar"
import { VideoPanel } from "@/features/editor/video-panel"
import { useEditorKeyboardShortcuts } from "@/features/editor/hooks/use-editor-keyboard-shortcuts"
import { useEffectiveAsrModel } from "@/features/editor/hooks/use-effective-asr-model"
import { useEffectiveCaptionDisplay } from "@/features/editor/hooks/use-effective-caption-display"
import { useElementHeight } from "@/features/editor/hooks/use-element-height"
import {
  useExportSubtitlesMutation,
  type ExportFormat,
  type ExportMode,
} from "@/features/editor/hooks/use-export-subtitles-mutation"
import { useProjectLifecycle } from "@/features/editor/hooks/use-project-lifecycle"
import { useTranscribeMutation } from "@/features/editor/hooks/use-transcribe-mutation"
import { useTranslateMutation } from "@/features/editor/hooks/use-translate-mutation"
import { useTranslationDefaultsSync } from "@/features/editor/hooks/use-translation-defaults-sync"
import { clampCaptionPosition } from "@/features/editor/caption-position"
import type { CaptionColors } from "@/lib/caption-colors"
import { cancelTranscribe, listModels } from "@/lib/commands"
import { projectDisplayName } from "@/lib/project-display-name"
import { useEditorStore } from "@/store/useEditorStore"
import { usePlayerStore } from "@/store/usePlayerStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { useTranslationStore } from "@/store/useTranslationStore"

const editorRouteApi = getRouteApi("/editor")

export const EditorPage = () => {
  const { projectPath } = editorRouteApi.useSearch()

  const project = useEditorStore((s) => s.project)
  const pushUndo = useEditorStore((s) => s.pushUndo)
  const setCueText = useEditorStore((s) => s.setCueText)
  const setCueTranslatedText = useEditorStore((s) => s.setCueTranslatedText)
  const setCueTimes = useEditorStore((s) => s.setCueTimes)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const setProjectCaptionFontSizePx = useEditorStore(
    (s) => s.setProjectCaptionFontSizePx,
  )
  const setProjectCaptionMaxWidthPercent = useEditorStore(
    (s) => s.setProjectCaptionMaxWidthPercent,
  )
  const setProjectCaptionFontFamily = useEditorStore(
    (s) => s.setProjectCaptionFontFamily,
  )
  const setProjectCaptionPosition = useEditorStore(
    (s) => s.setProjectCaptionPosition,
  )
  const setProjectCaptionTextColor = useEditorStore(
    (s) => s.setProjectCaptionTextColor,
  )
  const setProjectCaptionBackgroundColor = useEditorStore(
    (s) => s.setProjectCaptionBackgroundColor,
  )
  const setProjectCaptionBackgroundOpacity = useEditorStore(
    (s) => s.setProjectCaptionBackgroundOpacity,
  )
  const clearProjectCaptionAppearance = useEditorStore(
    (s) => s.clearProjectCaptionAppearance,
  )

  const hydrated = useSettingsStore((s) => s.hydrated)
  const settingsCaptionFontSizePx = useSettingsStore((s) => s.captionFontSizePx)
  const settingsCaptionFontFamily = useSettingsStore((s) => s.captionFontFamily)
  const settingsCaptionPositionX = useSettingsStore((s) => s.captionPositionXPercent)
  const settingsCaptionPositionY = useSettingsStore((s) => s.captionPositionYPercent)
  const settingsCaptionTextColor = useSettingsStore((s) => s.captionTextColor)
  const settingsCaptionBackgroundColor = useSettingsStore((s) => s.captionBackgroundColor)
  const settingsCaptionBackgroundOpacity = useSettingsStore((s) => s.captionBackgroundOpacity)
  const captionTextMode = useSettingsStore((s) => s.captionTextMode)
  const setCaptionTextMode = useSettingsStore((s) => s.setCaptionTextMode)

  const provider = useTranslationStore((s) => s.provider)
  const sourceLang = useTranslationStore((s) => s.sourceLang)
  const targetLang = useTranslationStore((s) => s.targetLang)
  const setProvider = useTranslationStore((s) => s.setProvider)
  const setSourceLang = useTranslationStore((s) => s.setSourceLang)
  const setTargetLang = useTranslationStore((s) => s.setTargetLang)

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [modelId, setModelId] = useState<string>("base")
  const [asrLang, setAsrLang] = useState("")
  const [cuesDrawerOpen, setCuesDrawerOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>("srt")
  const [exportMode, setExportMode] = useState<ExportMode>("original")

  const videoColumnRef = useRef<HTMLDivElement>(null)
  const videoColumnHeightPx = useElementHeight(videoColumnRef, project)

  // Lifecycles & syncs
  useProjectLifecycle({
    projectPath: projectPath || null,
    onProjectLoaded: () => setSelectedIndex(null),
  })
  useTranslationDefaultsSync()
  useEditorKeyboardShortcuts({ selectedIndex, setSelectedIndex })

  // Models query → installed list → effective model id
  const modelsQuery = useQuery({
    queryKey: ["listModels"],
    queryFn: listModels,
    enabled: hydrated,
  })
  const installedModels = useMemo(
    () => modelsQuery.data?.whisper.filter((m) => m.installed) ?? [],
    [modelsQuery.data],
  )
  const effectiveAsrModelId = useEffectiveAsrModel({
    installedModels,
    modelId,
    setModelId,
  })

  // Mutations
  const transcribe = useTranscribeMutation({
    projectPath: projectPath || null,
    modelId: effectiveAsrModelId,
    language: asrLang,
  })
  const translate = useTranslateMutation({
    projectPath: projectPath || null,
    provider,
    sourceLang,
    targetLang,
  })
  const exportMut = useExportSubtitlesMutation({
    projectPath: projectPath || null,
    format: exportFormat,
    mode: exportMode,
    onSuccess: () => setExportOpen(false),
  })

  // Caption display: settings position/colors are derived once and merged with project overrides.
  const settingsCaptionPosition = useMemo(
    () => clampCaptionPosition(settingsCaptionPositionX, settingsCaptionPositionY),
    [settingsCaptionPositionX, settingsCaptionPositionY],
  )
  const settingsCaptionColors = useMemo(
    (): CaptionColors => ({
      textColor: settingsCaptionTextColor,
      backgroundColor: settingsCaptionBackgroundColor,
      backgroundOpacity: settingsCaptionBackgroundOpacity,
    }),
    [
      settingsCaptionTextColor,
      settingsCaptionBackgroundColor,
      settingsCaptionBackgroundOpacity,
    ],
  )
  const {
    effectiveCaptionFontSizePx,
    effectiveCaptionFontFamily,
    effectiveCaptionMaxWidthPercent,
    effectiveCaptionPosition,
    effectiveCaptionColors,
    captionControlDisplay,
  } = useEffectiveCaptionDisplay({
    project,
    settingsCaptionFontSizePx,
    settingsCaptionFontFamily,
    settingsCaptionPosition,
    settingsCaptionColors,
  })

  const setCurrentTimeMs = usePlayerStore((s) => s.setCurrentTimeMs)

  // Cue commit handlers (de-dupe + push undo)
  const handleSeek = useCallback(
    (ms: number) => {
      setCurrentTimeMs(ms)
    },
    [setCurrentTimeMs],
  )

  const handleCommitText = useCallback(
    (index: number, text: string) => {
      const c = useEditorStore.getState().project?.cues[index]
      if (c && c.text === text) return
      pushUndo()
      setCueText(index, text)
    },
    [pushUndo, setCueText],
  )

  const handleCommitTranslatedText = useCallback(
    (index: number, text: string) => {
      const c = useEditorStore.getState().project?.cues[index]
      const trimmed = text.trim()
      const next = trimmed.length > 0 ? trimmed : null
      const prev = c?.translatedText ?? null
      if (c && prev === next) return
      pushUndo()
      setCueTranslatedText(index, text)
    },
    [pushUndo, setCueTranslatedText],
  )

  const handleCommitTimes = useCallback(
    (index: number, startMs: number, endMs: number) => {
      setCueTimes(index, startMs, endMs)
    },
    [setCueTimes],
  )

  const handleTranslateOne = useCallback(
    (index: number) => {
      translate.mutation.mutate([index])
    },
    [translate.mutation],
  )

  // Empty / loading
  if (!projectPath) return <EditorEmptyState variant="missing" />
  if (!project) return <EditorEmptyState variant="loading" />

  const videoSrc = convertFileSrc(project.videoPath)
  const projectTitle = projectDisplayName(projectPath)

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-4">
      <EditorPageHeader
        projectPath={projectPath}
        projectTitle={projectTitle}
        cueCount={project.cues.length}
        onUndo={undo}
        onRedo={redo}
        onOpenCues={() => setCuesDrawerOpen(true)}
        onOpenExport={() => setExportOpen(true)}
      />

      <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-start">
        <div ref={videoColumnRef} className="min-w-0 w-full flex-1 space-y-2">
          <ProjectCaptionAppearanceBar
            displayFontSizePx={captionControlDisplay.fontSizePx}
            displayFontFamily={captionControlDisplay.fontFamily}
            displayCaptionPosition={captionControlDisplay.captionPosition}
            displayCaptionColors={captionControlDisplay.captionColors}
            defaultFontSizePx={settingsCaptionFontSizePx}
            defaultFontFamily={settingsCaptionFontFamily}
            defaultCaptionPosition={settingsCaptionPosition}
            defaultCaptionColors={settingsCaptionColors}
            hasProjectOverride={captionControlDisplay.hasProjectOverride}
            onFontSizeChange={setProjectCaptionFontSizePx}
            onFontFamilyChange={setProjectCaptionFontFamily}
            onCaptionTextColorChange={setProjectCaptionTextColor}
            onCaptionBackgroundColorChange={setProjectCaptionBackgroundColor}
            onCaptionBackgroundOpacityChange={setProjectCaptionBackgroundOpacity}
            onResetToSettingsDefaults={clearProjectCaptionAppearance}
          />
          <EditorCaptionModeToggle
            value={captionTextMode}
            onChange={setCaptionTextMode}
          />
          <VideoPanel
            videoSrc={videoSrc}
            cues={project.cues}
            captionTextMode={captionTextMode}
            captionFontSizePx={effectiveCaptionFontSizePx}
            captionMaxWidthPercent={effectiveCaptionMaxWidthPercent}
            captionFontFamily={effectiveCaptionFontFamily}
            captionPosition={effectiveCaptionPosition}
            captionColors={effectiveCaptionColors}
            captionPositionDraggable
            onCaptionPositionChange={setProjectCaptionPosition}
            onCaptionFontSizeChange={setProjectCaptionFontSizePx}
            onCaptionMaxWidthChange={setProjectCaptionMaxWidthPercent}
          />
        </div>
        <EditorCaptionTrackingPanel
          cues={project.cues}
          bilingual={captionTextMode === "bilingual"}
          selectedIndex={selectedIndex}
          syncHeightPx={videoColumnHeightPx}
          onSeek={handleSeek}
          onSelectCue={setSelectedIndex}
        />
      </div>

      <EditorCueDrawer
        open={cuesDrawerOpen}
        onOpenChange={setCuesDrawerOpen}
        cues={project.cues}
        bilingual={captionTextMode === "bilingual"}
        selectedIndex={selectedIndex}
        onSeek={handleSeek}
        onSelect={setSelectedIndex}
        onCommitText={handleCommitText}
        onCommitTranslatedText={handleCommitTranslatedText}
        onCommitTimes={handleCommitTimes}
        onTranslateOne={handleTranslateOne}
      />

      <EditorTranscribePanel
        installedModels={installedModels}
        modelId={effectiveAsrModelId}
        onModelIdChange={setModelId}
        language={asrLang}
        onLanguageChange={setAsrLang}
        isPending={transcribe.mutation.isPending}
        isError={transcribe.mutation.isError}
        error={transcribe.mutation.error}
        whisperPercent={transcribe.whisperPercent}
        pcmBytes={transcribe.pcmBytes}
        taskId={transcribe.taskId}
        onRun={() => transcribe.mutation.mutate()}
        onCancel={() => {
          if (transcribe.taskId) void cancelTranscribe(transcribe.taskId)
        }}
      />

      <EditorTranslatePanel
        cueCount={project.cues.length}
        provider={provider}
        onProviderChange={setProvider}
        sourceLang={sourceLang}
        onSourceLangChange={setSourceLang}
        targetLang={targetLang}
        onTargetLangChange={setTargetLang}
        isPending={translate.mutation.isPending}
        isSuccess={translate.mutation.isSuccess}
        isError={translate.mutation.isError}
        error={translate.mutation.error}
        progress={translate.progress}
        onRun={() => translate.mutation.mutate(null)}
      />

      <EditorShortcutsBar />

      <EditorExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        format={exportFormat}
        onFormatChange={setExportFormat}
        mode={exportMode}
        onModeChange={setExportMode}
        isPending={exportMut.isPending}
        isError={exportMut.isError}
        error={exportMut.error}
        onConfirm={() => exportMut.mutate()}
      />
    </div>
  )
}
