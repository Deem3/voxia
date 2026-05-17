"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  Export,
  Microphone,
  Translate,
  X,
} from "@phosphor-icons/react";
import { getRouteApi } from "@tanstack/react-router";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BackToLibraryLink } from "@/components/back-to-library-link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  clampCaptionPosition,
  hasProjectCaptionPositionOverride,
  resolveEffectiveCaptionPosition,
  type CaptionPosition,
} from "@/features/editor/caption-position";
import {
  clampCaptionMaxWidthPercent,
  DEFAULT_CAPTION_MAX_WIDTH_PERCENT,
} from "@/features/editor/caption-size";
import {
  CAPTION_TEXT_MODE_OPTIONS,
  type CaptionTextMode,
} from "@/features/editor/caption-text-mode";
import { EditorCaptionTrackingPanel } from "@/features/editor/editor-caption-tracking-panel";
import {
  EditorCueDrawer,
  EditorCueDrawerTrigger,
} from "@/features/editor/editor-cue-drawer";
import { ProjectCaptionAppearanceBar } from "@/features/editor/project-caption-appearance-bar";
import { VideoPanel } from "@/features/editor/video-panel";
import {
  hasProjectCaptionColorOverride,
  resolveEffectiveCaptionColors,
  type CaptionColors,
} from "@/lib/caption-colors";
import {
  cancelTranscribe,
  exportSubtitles,
  listModels,
  transcribeProject,
  translateCues,
} from "@/lib/commands";
import {
  listenModelProgress,
  listenTranscribeProgress,
  listenTranslateProgress,
} from "@/lib/events";
import { formatInvokeError } from "@/lib/format-invoke-error";
import {
  formatNotifyError,
  notifyTaskFailed,
  notifyTaskStarted,
  notifyTaskSucceeded,
} from "@/lib/notifications";
import { projectDisplayName } from "@/lib/project-display-name";
import { useEditorStore } from "@/store/useEditorStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTranslationStore } from "@/store/useTranslationStore";

const editorRouteApi = getRouteApi("/editor");

const formatMutationError = (e: unknown): string =>
  e instanceof Error && e.message.trim() !== ""
    ? e.message
    : formatInvokeError(e);

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const EditorPage = () => {
  const { projectPath } = editorRouteApi.useSearch();
  const queryClient = useQueryClient();
  const project = useEditorStore((s) => s.project);
  const load = useEditorStore((s) => s.load);
  const reset = useEditorStore((s) => s.reset);
  const setProject = useEditorStore((s) => s.setProject);
  const pushUndo = useEditorStore((s) => s.pushUndo);
  const setCueText = useEditorStore((s) => s.setCueText);
  const setCueTranslatedText = useEditorStore((s) => s.setCueTranslatedText);
  const setCueTimes = useEditorStore((s) => s.setCueTimes);
  const splitCueAt = useEditorStore((s) => s.splitCueAt);
  const mergeWithPrevious = useEditorStore((s) => s.mergeWithPrevious);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const saveNow = useEditorStore((s) => s.saveNow);
  const setProjectCaptionFontSizePx = useEditorStore(
    (s) => s.setProjectCaptionFontSizePx,
  );
  const setProjectCaptionMaxWidthPercent = useEditorStore(
    (s) => s.setProjectCaptionMaxWidthPercent,
  );
  const setProjectCaptionFontFamily = useEditorStore(
    (s) => s.setProjectCaptionFontFamily,
  );
  const setProjectCaptionPosition = useEditorStore(
    (s) => s.setProjectCaptionPosition,
  );
  const setProjectCaptionTextColor = useEditorStore(
    (s) => s.setProjectCaptionTextColor,
  );
  const setProjectCaptionBackgroundColor = useEditorStore(
    (s) => s.setProjectCaptionBackgroundColor,
  );
  const setProjectCaptionBackgroundOpacity = useEditorStore(
    (s) => s.setProjectCaptionBackgroundOpacity,
  );
  const clearProjectCaptionAppearance = useEditorStore(
    (s) => s.clearProjectCaptionAppearance,
  );

  const setCurrentTimeMs = usePlayerStore((s) => s.setCurrentTimeMs);
  const setDurationMs = usePlayerStore((s) => s.setDurationMs);
  const setPlaying = usePlayerStore((s) => s.setPlaying);

  const hydrated = useSettingsStore((s) => s.hydrated);
  const defaultTranslatorProvider = useSettingsStore(
    (s) => s.defaultTranslatorProvider,
  );
  const defaultSourceLang = useSettingsStore((s) => s.defaultSourceLang);
  const defaultTargetLang = useSettingsStore((s) => s.defaultTargetLang);
  const settingsCaptionFontSizePx = useSettingsStore(
    (s) => s.captionFontSizePx,
  );
  const settingsCaptionFontFamily = useSettingsStore(
    (s) => s.captionFontFamily,
  );
  const settingsCaptionPositionX = useSettingsStore(
    (s) => s.captionPositionXPercent,
  );
  const settingsCaptionPositionY = useSettingsStore(
    (s) => s.captionPositionYPercent,
  );
  const settingsCaptionTextColor = useSettingsStore((s) => s.captionTextColor);
  const settingsCaptionBackgroundColor = useSettingsStore(
    (s) => s.captionBackgroundColor,
  );
  const settingsCaptionBackgroundOpacity = useSettingsStore(
    (s) => s.captionBackgroundOpacity,
  );
  const captionTextMode = useSettingsStore((s) => s.captionTextMode);
  const setCaptionTextMode = useSettingsStore((s) => s.setCaptionTextMode);

  const provider = useTranslationStore((s) => s.provider);
  const sourceLang = useTranslationStore((s) => s.sourceLang);
  const targetLang = useTranslationStore((s) => s.targetLang);
  const setProvider = useTranslationStore((s) => s.setProvider);
  const setSourceLang = useTranslationStore((s) => s.setSourceLang);
  const setTargetLang = useTranslationStore((s) => s.setTargetLang);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [modelId, setModelId] = useState<string>("base");
  const [asrLang, setAsrLang] = useState("");
  const [transcribePct, setTranscribePct] = useState<number | null>(null);
  const [transcribePcmBytes, setTranscribePcmBytes] = useState<number | null>(
    null,
  );
  const [transcribeTaskId, setTranscribeTaskId] = useState<string | null>(null);
  const [translateProgress, setTranslateProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const taskIdRef = useRef<string | null>(null);
  const transcribeAudioPrepRef = useRef(false);
  const [cuesDrawerOpen, setCuesDrawerOpen] = useState(false);
  const videoColumnRef = useRef<HTMLDivElement>(null);
  const [videoColumnHeightPx, setVideoColumnHeightPx] = useState<number | null>(
    null,
  );
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"srt" | "vtt">("srt");
  const [exportMode, setExportMode] = useState<
    "original" | "translated" | "bilingual"
  >("original");

  const modelsQuery = useQuery({
    queryKey: ["listModels"],
    queryFn: listModels,
    enabled: hydrated,
  });

  const whisperInstalledModels = useMemo(
    () => modelsQuery.data?.whisper.filter((m) => m.installed) ?? [],
    [modelsQuery.data],
  );

  useEffect(() => {
    const el = videoColumnRef.current;
    if (!el) return;
    const update = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 0) setVideoColumnHeightPx(h);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [project]);

  const effectiveAsrModelId = useMemo(() => {
    const list = whisperInstalledModels;
    if (list.length === 0) return "";
    if (list.some((m) => m.id === modelId)) return modelId;
    const preference = ["base", "small", "tiny"];
    return (
      preference.find((id) => list.some((m) => m.id === id)) ??
      list[0]?.id ??
      ""
    );
  }, [whisperInstalledModels, modelId]);

  useEffect(() => {
    if (effectiveAsrModelId && effectiveAsrModelId !== modelId) {
      setModelId(effectiveAsrModelId);
    }
  }, [effectiveAsrModelId, modelId]);

  useEffect(() => {
    if (!hydrated) return;
    setProvider(defaultTranslatorProvider);
    setSourceLang(defaultSourceLang);
    setTargetLang(defaultTargetLang);
  }, [
    hydrated,
    defaultTranslatorProvider,
    defaultSourceLang,
    defaultTargetLang,
    setProvider,
    setSourceLang,
    setTargetLang,
  ]);

  useEffect(() => {
    if (!projectPath) {
      reset();
      return;
    }
    void (async () => {
      try {
        await load(projectPath);
        setSelectedIndex(null);
        setCurrentTimeMs(0);
        setDurationMs(0);
        setPlaying(false);
      } catch (e) {
        console.error(e);
        reset();
      }
    })();
    return () => {
      void saveNow();
    };
  }, [
    projectPath,
    load,
    reset,
    setCurrentTimeMs,
    setDurationMs,
    setPlaying,
    saveNow,
  ]);

  useEffect(() => {
    let un: (() => void) | undefined;
    void listenTranscribeProgress((p) => {
      if (taskIdRef.current && p.taskId === taskIdRef.current) {
        setTranscribePcmBytes(null);
        setTranscribePct(p.percent);
      }
    }).then((u) => {
      un = u;
    });
    return () => {
      un?.();
    };
  }, []);

  useEffect(() => {
    let un: (() => void) | undefined;
    void listenModelProgress((p) => {
      if (!transcribeAudioPrepRef.current) return;
      if (p.kind === "ffmpeg" && p.id === "decode" && p.phase === "pcm") {
        setTranscribePcmBytes(Number(p.bytesReceived));
      }
    }).then((u) => {
      un = u;
    });
    return () => {
      un?.();
    };
  }, []);

  useEffect(() => {
    let un: (() => void) | undefined;
    void listenTranslateProgress((p) => {
      const done = Number(p.done);
      const total = Number(p.total);
      if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return;
      setTranslateProgress({ done, total });
    }).then((u) => {
      un = u;
    });
    return () => {
      un?.();
    };
  }, []);

  const transcribeMut = useMutation({
    mutationFn: async () => {
      if (!projectPath) throw new Error("missing project");
      if (!effectiveAsrModelId.trim()) {
        throw new Error(
          "No Whisper model is available. Install tiny or base in Settings → Models.",
        );
      }
      const taskId = crypto.randomUUID();
      taskIdRef.current = taskId;
      setTranscribeTaskId(taskId);
      const res = await transcribeProject({
        projectPath,
        modelId: effectiveAsrModelId,
        language: asrLang.trim() === "" ? null : asrLang.trim(),
        taskId,
      });
      return res;
    },
    onMutate: () => {
      transcribeAudioPrepRef.current = true;
      setTranscribePct(null);
      setTranscribePcmBytes(null);
      void notifyTaskStarted(
        "Transcription started",
        "Extracting audio and running Whisper…",
      );
    },
    onSuccess: (res) => {
      setProject(res.project);
      void queryClient.invalidateQueries({ queryKey: ["listModels"] });
      setTranscribePct(null);
      taskIdRef.current = null;
      setTranscribeTaskId(null);
      void notifyTaskSucceeded(
        "Transcription complete",
        `${res.project.cues.length} cue${res.project.cues.length === 1 ? "" : "s"} created`,
      );
    },
    onError: (error) => {
      setTranscribePct(null);
      taskIdRef.current = null;
      setTranscribeTaskId(null);
      void notifyTaskFailed("Transcription failed", formatNotifyError(error));
    },
    onSettled: () => {
      transcribeAudioPrepRef.current = false;
      setTranscribePcmBytes(null);
    },
  });

  const translateMut = useMutation({
    mutationFn: async (cueIndices: number[] | null) => {
      if (!projectPath) throw new Error("missing project");
      return translateCues({
        projectPath,
        providerId: provider,
        src: sourceLang,
        tgt: targetLang,
        cueIndices,
      });
    },
    onMutate: (cueIndices) => {
      const count = cueIndices?.length ?? project?.cues.length ?? 0;
      setTranslateProgress(
        count > 0 ? { done: 0, total: count } : null,
      );
      void notifyTaskStarted(
        "Translation started",
        count > 0
          ? `Translating ${count} cue${count === 1 ? "" : "s"} via ${provider}`
          : `Translating via ${provider}`,
      );
    },
    onSuccess: (proj, cueIndices) => {
      setProject(proj);
      const count = cueIndices?.length ?? proj.cues.length;
      setTranslateProgress(
        count > 0 ? { done: count, total: count } : null,
      );
      void notifyTaskSucceeded(
        "Translation complete",
        `${count} cue${count === 1 ? "" : "s"} updated`,
      );
    },
    onError: (error) => {
      void notifyTaskFailed("Translation failed", formatNotifyError(error));
    },
    onSettled: () => {
      setTranslateProgress(null);
    },
  });

  const exportMut = useMutation({
    mutationFn: async () => {
      if (!projectPath) throw new Error("missing project");
      return exportSubtitles({
        projectPath,
        format: exportFormat,
        mode: exportMode,
        outputPath: null,
      });
    },
    onSuccess: () => {
      setExportOpen(false);
    },
  });

  const handleSeek = useCallback(
    (ms: number) => {
      setCurrentTimeMs(ms);
    },
    [setCurrentTimeMs],
  );

  const handleCommitText = useCallback(
    (index: number, text: string) => {
      const c = useEditorStore.getState().project?.cues[index];
      if (c && c.text === text) return;
      pushUndo();
      setCueText(index, text);
    },
    [pushUndo, setCueText],
  );

  const handleCommitTranslatedText = useCallback(
    (index: number, text: string) => {
      const c = useEditorStore.getState().project?.cues[index];
      const trimmed = text.trim();
      const next = trimmed.length > 0 ? trimmed : null;
      const prev = c?.translatedText ?? null;
      if (c && prev === next) return;
      pushUndo();
      setCueTranslatedText(index, text);
    },
    [pushUndo, setCueTranslatedText],
  );

  const handleCommitTimes = useCallback(
    (index: number, startMs: number, endMs: number) => {
      setCueTimes(index, startMs, endMs);
    },
    [setCueTimes],
  );

  const handleTranslateOne = useCallback(
    (index: number) => {
      translateMut.mutate([index]);
    },
    [translateMut],
  );

  const settingsCaptionPosition = useMemo(
    () =>
      clampCaptionPosition(settingsCaptionPositionX, settingsCaptionPositionY),
    [settingsCaptionPositionX, settingsCaptionPositionY],
  );

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
  );

  const handleCaptionPositionChange = useCallback(
    (next: CaptionPosition) => {
      setProjectCaptionPosition(next);
    },
    [setProjectCaptionPosition],
  );

  const handleCaptionFontSizeChange = useCallback(
    (px: number) => {
      setProjectCaptionFontSizePx(px);
    },
    [setProjectCaptionFontSizePx],
  );

  const handleCaptionMaxWidthChange = useCallback(
    (percent: number) => {
      setProjectCaptionMaxWidthPercent(percent);
    },
    [setProjectCaptionMaxWidthPercent],
  );

  const advanceCue = useCallback(() => {
    if (!project || project.cues.length === 0) return;
    setSelectedIndex((i) => {
      if (i === null) return 0;
      return Math.min(project.cues.length - 1, i + 1);
    });
  }, [project]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ae = document.activeElement;
      const typing =
        ae &&
        (ae.tagName === "INPUT" ||
          ae.tagName === "TEXTAREA" ||
          ae.getAttribute("contenteditable") === "true");
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if (typing) {
        return;
      }

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        const st = usePlayerStore.getState();
        setPlaying(!st.playing);
        return;
      }
      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        const st = usePlayerStore.getState();
        setCurrentTimeMs(Math.max(0, st.currentTimeMs - 5000));
        return;
      }
      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        const st = usePlayerStore.getState();
        const d = st.durationMs;
        setCurrentTimeMs(
          Math.min(
            d > 0 ? d : st.currentTimeMs + 5000,
            st.currentTimeMs + 5000,
          ),
        );
        return;
      }
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        setPlaying(false);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex !== null) {
          const t = usePlayerStore.getState().currentTimeMs;
          splitCueAt(selectedIndex, t);
        }
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        if (selectedIndex !== null && selectedIndex > 0) {
          mergeWithPrevious(selectedIndex);
          setSelectedIndex((i) => (i === null ? null : Math.max(0, i - 1)));
        }
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        advanceCue();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    advanceCue,
    mergeWithPrevious,
    redo,
    selectedIndex,
    setCurrentTimeMs,
    setPlaying,
    splitCueAt,
    undo,
  ]);

  const {
    effectiveCaptionFontSizePx,
    effectiveCaptionFontFamily,
    effectiveCaptionMaxWidthPercent,
    effectiveCaptionPosition,
    effectiveCaptionColors,
    captionControlDisplay,
  } = useMemo(() => {
    if (!project) {
      return {
        effectiveCaptionFontSizePx: settingsCaptionFontSizePx,
        effectiveCaptionFontFamily: settingsCaptionFontFamily,
        effectiveCaptionMaxWidthPercent: DEFAULT_CAPTION_MAX_WIDTH_PERCENT,
        effectiveCaptionPosition: settingsCaptionPosition,
        effectiveCaptionColors: settingsCaptionColors,
        captionControlDisplay: {
          fontSizePx: settingsCaptionFontSizePx,
          fontFamily: settingsCaptionFontFamily,
          captionPosition: settingsCaptionPosition,
          captionColors: settingsCaptionColors,
          hasProjectOverride: false,
        },
      };
    }
    const rawSize = project.captionFontSizePx;
    const effectiveCaptionFontSizePx =
      rawSize != null && Number.isFinite(rawSize)
        ? Math.min(72, Math.max(10, Math.round(rawSize)))
        : settingsCaptionFontSizePx;
    const rawWidth = project.captionMaxWidthPercent;
    const effectiveCaptionMaxWidthPercent =
      rawWidth != null && Number.isFinite(rawWidth)
        ? clampCaptionMaxWidthPercent(rawWidth)
        : DEFAULT_CAPTION_MAX_WIDTH_PERCENT;
    const rawFam = project.captionFontFamily;
    const effectiveCaptionFontFamily =
      rawFam != null && rawFam.trim() !== ""
        ? rawFam.trim()
        : settingsCaptionFontFamily;
    const effectiveCaptionPosition = resolveEffectiveCaptionPosition(
      project,
      settingsCaptionPosition,
    );
    const effectiveCaptionColors = resolveEffectiveCaptionColors(
      project,
      settingsCaptionColors,
    );
    const hasSizeOverride = rawSize != null && Number.isFinite(rawSize);
    const hasWidthOverride = rawWidth != null && Number.isFinite(rawWidth);
    const hasFamilyOverride = rawFam != null && rawFam.trim() !== "";
    const hasPositionOverride = hasProjectCaptionPositionOverride(project);
    const hasColorOverride = hasProjectCaptionColorOverride(project);
    return {
      effectiveCaptionFontSizePx,
      effectiveCaptionFontFamily,
      effectiveCaptionMaxWidthPercent,
      effectiveCaptionPosition,
      effectiveCaptionColors,
      captionControlDisplay: {
        fontSizePx: effectiveCaptionFontSizePx,
        fontFamily: effectiveCaptionFontFamily,
        captionPosition: effectiveCaptionPosition,
        captionColors: effectiveCaptionColors,
        hasProjectOverride:
          hasSizeOverride ||
          hasWidthOverride ||
          hasFamilyOverride ||
          hasPositionOverride ||
          hasColorOverride,
      },
    };
  }, [
    project,
    settingsCaptionFontSizePx,
    settingsCaptionFontFamily,
    settingsCaptionPosition,
    settingsCaptionColors,
  ]);

  if (!projectPath) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Editor
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick a project from the library to open the editor.
        </p>
        <BackToLibraryLink />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Editor
        </h1>
        <p className="text-sm text-muted-foreground">Loading project…</p>
      </div>
    );
  }

  const videoSrc = convertFileSrc(project.videoPath);
  const hasWhisper = whisperInstalledModels.length > 0;
  const projectTitle = projectDisplayName(projectPath);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-4">
      <div className="w-full min-w-0 space-y-3 overflow-hidden border-b border-border pb-4">
        <BackToLibraryLink />
        <h1
          className="truncate text-2xl font-semibold tracking-tight text-foreground"
          title={projectPath}
        >
          {projectTitle}
        </h1>
        <div className="flex flex-wrap gap-2">
            <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => undo()}
            disabled={!project}
            title="Undo last edit"
          >
            <ArrowUUpLeft className="size-4 shrink-0" weight="bold" aria-hidden />
            Undo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => redo()}
            disabled={!project}
            title="Redo"
          >
            <ArrowUUpRight className="size-4 shrink-0" weight="bold" aria-hidden />
            Redo
          </Button>
          <EditorCueDrawerTrigger
            cueCount={project.cues.length}
            onOpen={() => setCuesDrawerOpen(true)}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setExportOpen(true)}
            title="Export subtitles to SRT or VTT"
          >
            <Export className="size-4 shrink-0" weight="duotone" aria-hidden />
            Export…
          </Button>
        </div>
      </div>

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
            onCaptionBackgroundOpacityChange={
              setProjectCaptionBackgroundOpacity
            }
          onResetToSettingsDefaults={clearProjectCaptionAppearance}
        />
        <label className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">On-video caption</span>
          <select
            className="h-8 border border-input bg-background px-2 font-mono text-xs text-foreground"
            value={captionTextMode}
            onChange={(e) =>
              setCaptionTextMode(e.target.value as CaptionTextMode)
            }
            aria-label="Caption text shown on video"
          >
            {CAPTION_TEXT_MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
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
          onCaptionPositionChange={handleCaptionPositionChange}
          onCaptionFontSizeChange={handleCaptionFontSizeChange}
          onCaptionMaxWidthChange={handleCaptionMaxWidthChange}
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

      <div className="rounded-none border border-border bg-card/40 p-3">
        <p className="mb-2 text-xs font-medium text-foreground">Transcribe</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs text-muted-foreground">
            Model
            <select
              className="h-8 border border-input bg-background px-2 font-mono text-xs"
              value={effectiveAsrModelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={!hasWhisper}
              aria-label="Whisper model (installed only)"
            >
              {!hasWhisper ? (
                <option value="">No model installed</option>
              ) : (
                whisperInstalledModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} ({m.id})
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="grid min-w-[140px] flex-1 gap-1 text-xs text-muted-foreground">
            Language (optional)
            <input
              className="h-8 border border-input bg-background px-2 font-mono text-xs"
              placeholder="auto"
              value={asrLang}
              onChange={(e) => setAsrLang(e.target.value)}
              aria-label="Whisper language code"
            />
          </label>
          <Button
            type="button"
            size="sm"
            disabled={!hasWhisper || transcribeMut.isPending}
            onClick={() => transcribeMut.mutate()}
            title="Run Whisper transcription on this video"
          >
            <Microphone className="size-4 shrink-0" weight="duotone" aria-hidden />
            {transcribeMut.isPending ? "Transcribing…" : "Run transcription"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!transcribeMut.isPending || !transcribeTaskId}
            onClick={() => {
              if (transcribeTaskId) void cancelTranscribe(transcribeTaskId);
            }}
            title="Cancel transcription"
          >
            <X className="size-4 shrink-0" weight="bold" aria-hidden />
            Cancel
          </Button>
        </div>
        {!hasWhisper ? (
          <p className="mt-2 text-xs text-destructive">
            No Whisper model installed. Download{" "}
            <span className="font-mono">tiny</span> or{" "}
            <span className="font-mono">base</span> in Settings → Models.
          </p>
        ) : null}
        {transcribeMut.isPending ? (
          <div className="mt-2 space-y-1">
            {transcribePct === null ? (
              transcribePcmBytes !== null ? (
                <p className="font-mono text-xs text-muted-foreground">
                  Extracting audio (ffmpeg): {formatBytes(transcribePcmBytes)}{" "}
                  PCM
                </p>
              ) : (
                <p className="font-mono text-xs text-muted-foreground">
                  Extracting audio (ffmpeg)… this step can take a while on long
                  files.
                </p>
              )
            ) : null}
            {transcribePct !== null ? (
              <p className="font-mono text-xs text-muted-foreground">
                Whisper: {transcribePct}%
              </p>
            ) : null}
          </div>
        ) : null}
        {transcribeMut.isError ? (
          <div
            role="alert"
            className="mt-2 rounded-none border border-destructive/60 bg-destructive/10 px-3 py-2"
          >
            <p className="text-xs font-medium text-destructive">
              Transcription failed
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-foreground/90">
              {formatMutationError(transcribeMut.error)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-none border border-border bg-card/40 p-3">
        <p className="mb-2 text-xs font-medium text-foreground">Translate</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs text-muted-foreground">
            Provider
            <select
              className="h-8 border border-input bg-background px-2 font-mono text-xs"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              aria-label="Translator provider"
            >
              <option value="google">google (API key optional)</option>
              <option value="nllb">nllb (local)</option>
              <option value="azure">azure</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Source
            <input
              className="h-8 w-24 border border-input bg-background px-2 font-mono text-xs"
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              aria-label="Source language"
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Target
            <input
              className="h-8 w-24 border border-input bg-background px-2 font-mono text-xs"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              aria-label="Target language"
            />
          </label>
          <Button
            type="button"
            size="sm"
            disabled={translateMut.isPending || project.cues.length === 0}
            onClick={() => translateMut.mutate(null)}
            title="Translate all cues"
          >
            <Translate className="size-4 shrink-0" weight="duotone" aria-hidden />
            {translateMut.isPending && translateProgress
              ? `Translating… ${translateProgress.done}/${translateProgress.total}`
              : translateMut.isPending
                ? "Translating…"
                : "Translate all"}
          </Button>
        </div>
        {translateMut.isPending && translateProgress && translateProgress.total > 0 ? (
          <div className="mt-3 space-y-1.5">
            <Progress
              value={Math.round(
                (translateProgress.done / translateProgress.total) * 100,
              )}
              aria-label={`Translation progress ${translateProgress.done} of ${translateProgress.total}`}
            />
            <p className="text-[0.65rem] text-muted-foreground">
              {translateProgress.done} of {translateProgress.total} cues
              {translateProgress.done >= translateProgress.total
                ? " — finishing…"
                : ""}
            </p>
          </div>
        ) : null}
        {translateMut.isSuccess && !translateMut.isPending ? (
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
            Translation finished — updated cues are in the caption rail.
          </p>
        ) : null}
        {translateMut.isError ? (
          <div
            role="alert"
            className="mt-2 rounded-none border border-destructive/60 bg-destructive/10 px-3 py-2"
          >
            <p className="text-xs font-medium text-destructive">
              Translation failed
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-foreground/90">
              {formatMutationError(translateMut.error)}
            </p>
          </div>
        ) : null}
      </div>

      <p className="text-[0.65rem] text-muted-foreground">
        Shortcuts: Space play · J/L ±5s · K pause · Enter split · Backspace merge
        · Tab next cue · Use Edit cues to change text and timing
      </p>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export subtitles</DialogTitle>
            <DialogDescription id="export-dialog-desc">
              Choose format and track layout. A save dialog opens next.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Format</span>
              <select
                className="h-9 border border-input bg-background px-2"
                value={exportFormat}
                onChange={(e) =>
                  setExportFormat(e.target.value as "srt" | "vtt")
                }
              >
                <option value="srt">SRT</option>
                <option value="vtt">VTT</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Mode</span>
              <select
                className="h-9 border border-input bg-background px-2"
                value={exportMode}
                onChange={(e) =>
                  setExportMode(e.target.value as typeof exportMode)
                }
              >
                <option value="original">Original</option>
                <option value="translated">Translated</option>
                <option value="bilingual">Bilingual</option>
              </select>
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExportOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              disabled={exportMut.isPending}
              onClick={() => exportMut.mutate()}
            >
              {exportMut.isPending ? "Exporting…" : "Choose file & export"}
            </Button>
          </DialogFooter>
          {exportMut.isError ? (
            <div
              role="alert"
              className="rounded-none border border-destructive/60 bg-destructive/10 px-3 py-2"
            >
              <p className="text-xs font-medium text-destructive">
                Export failed
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-foreground/90">
                {formatMutationError(exportMut.error)}
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};
