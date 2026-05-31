"use client"

import { getCurrentWebview } from "@tauri-apps/api/webview"
import { open } from "@tauri-apps/plugin-dialog"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import {
  ArrowRightIcon as ArrowRight,
  FileVideoIcon as FileVideo,
  FilmStripIcon as FilmStrip,
  FolderOpenIcon as FolderOpen,
  GearSixIcon as GearSix,
  LightningIcon as Lightning,
  PlusIcon as Plus,
  TrashIcon as Trash,
  UploadSimpleIcon as UploadSimple,
  WarningCircleIcon as WarningCircle,
} from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import { createProject, listModels } from "@/lib/commands"
import { pickFirstSupportedMediaPath } from "@/lib/media-paths"
import { useSettingsStore } from "@/store/useSettingsStore"
import { cn } from "@/lib/utils"

export const LibraryPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const hydrated = useSettingsStore((s) => s.hydrated)
  const recentProjectPaths = useSettingsStore((s) => s.recentProjectPaths)
  const addRecentProject = useSettingsStore((s) => s.addRecentProject)
  const removeRecentProject = useSettingsStore((s) => s.removeRecentProject)

  const modelsQuery = useQuery({
    queryKey: ["listModels"],
    queryFn: listModels,
    enabled: hydrated,
  })

  const whisperReady =
    modelsQuery.data?.whisper.some(
      (m) => m.installed && (m.id === "base" || m.id === "small" || m.id === "tiny"),
    ) ?? false

  const createMut = useMutation({
    mutationFn: async (videoPath: string) => {
      const res = await createProject(videoPath)
      return res
    },
    onSuccess: (res) => {
      addRecentProject(res.projectPath)
      void queryClient.invalidateQueries({ queryKey: ["listModels"] })
      void navigate({
        to: "/editor",
        search: { projectPath: res.projectPath },
      })
    },
  })

  const createMutRef = useRef(createMut)
  createMutRef.current = createMut

  const [fileDragActive, setFileDragActive] = useState(false)

  useEffect(() => {
    let unlisten: (() => void) | undefined
    let cancelled = false
    void (async () => {
      try {
        unlisten = await getCurrentWebview().onDragDropEvent((event) => {
          if (cancelled) return
          const e = event.payload
          if (e.type === "enter") {
            const ok = pickFirstSupportedMediaPath(e.paths) !== null
            setFileDragActive(ok)
            return
          }
          if (e.type === "over") return
          if (e.type === "leave") {
            setFileDragActive(false)
            return
          }
          if (e.type === "drop") {
            setFileDragActive(false)
            const path = pickFirstSupportedMediaPath(e.paths)
            if (!path) return
            const m = createMutRef.current
            if (m.isPending) return
            m.mutate(path)
          }
        })
      } catch {
        /* non-Tauri web preview */
      }
    })()
    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [])

  const handleNewProject = async () => {
    const picked = await open({
      multiple: false,
      directory: false,
      filters: [{ name: "Media", extensions: ["mp4", "mov", "mkv", "webm", "wav", "mp3"] }],
    })
    if (picked === null) return
    const path = Array.isArray(picked) ? picked[0] : picked
    if (!path) return
    createMut.mutate(path)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">

      {/* ── Hero ── */}
      <header className="space-y-4 animate-fade-up">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-block h-[2px] w-6 bg-signal rounded-full"
            aria-hidden
          />
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-signal/80">
            Project library
          </p>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Drop a video,{" "}
          <span className="text-signal">ship a subtitle.</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground animate-fade-up delay-50">
          Voxia transcribes, translates, and exports captions locally — no cloud required. Open a
          media file or drop one anywhere on this window to create a{" "}
          <code className="rounded-none border border-border/70 bg-muted/70 px-1.5 py-px font-mono text-[0.75em] text-foreground">
            .voxia.json
          </code>{" "}
          project.
        </p>
      </header>

      {/* ── Whisper warning ── */}
      {!whisperReady && hydrated ? (
        <div
          role="status"
          className={cn(
            "flex flex-wrap items-start gap-3 border border-amber-500/30 bg-amber-500/5 p-4",
            "animate-fade-up delay-75",
          )}
        >
          <WarningCircle
            className="mt-0.5 size-4.5 shrink-0 text-amber-500 dark:text-amber-400"
            weight="duotone"
            aria-hidden
          />
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-xs font-semibold text-foreground">
              Download a Whisper model first
            </p>
            <p className="text-xs text-muted-foreground">
              Transcription needs a local GGML model. In{" "}
              <strong className="font-medium text-foreground/80">Settings → Models</strong>, install{" "}
              <code className="font-mono text-foreground/90">tiny</code> or{" "}
              <code className="font-mono text-foreground/90">base</code> to begin.
            </p>
          </div>
          <Link
            to="/settings"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
          >
            <GearSix className="size-3.5 shrink-0" weight="duotone" aria-hidden />
            Settings
          </Link>
        </div>
      ) : null}

      {/* ── Drop zone / New project ── */}
      <section
        aria-label="Create new project"
        className={cn(
          "group relative overflow-hidden border-2 border-dashed transition-all duration-200",
          "animate-fade-up delay-100",
          fileDragActive
            ? "border-signal bg-signal-muted scale-[1.005] shadow-[0_0_0_4px_color-mix(in_oklab,var(--signal)_12%,transparent)]"
            : "border-border/70 bg-card/30 hover:border-signal/40 hover:bg-card/50",
        )}
        style={{ cursor: "default" }}
      >
        {/* Grid background */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-grid transition-opacity duration-200",
            fileDragActive ? "opacity-60" : "opacity-30 group-hover:opacity-50",
          )}
          aria-hidden
        />

        {/* Content */}
        <div className="relative flex flex-col items-center gap-5 px-8 py-10 text-center sm:py-14">
          <div
            className={cn(
              "inline-flex size-16 items-center justify-center border-2 transition-all duration-200",
              fileDragActive
                ? "border-signal bg-signal-muted text-signal scale-110 shadow-[0_0_20px_color-mix(in_oklab,var(--signal)_30%,transparent)]"
                : "border-border/70 bg-background/80 text-foreground/50 group-hover:border-signal/50 group-hover:text-signal/70",
            )}
            aria-hidden
          >
            <UploadSimple
              className="size-7 transition-transform duration-200 group-hover:scale-105"
              weight={fileDragActive ? "fill" : "duotone"}
            />
          </div>

          <div className="space-y-1.5">
            <p className={cn(
              "text-sm font-semibold transition-colors duration-150",
              fileDragActive ? "text-signal" : "text-foreground",
            )}>
              {fileDragActive ? "Release to start a project" : "Drop a media file"}
            </p>
            <p className="text-xs text-muted-foreground/80">
              .mp4 · .mov · .mkv · .webm · .wav · .mp3 — anywhere on this window
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={handleNewProject}
              disabled={createMut.isPending}
              className="gap-2"
            >
              {createMut.isPending ? (
                <>
                  <span
                    className="size-3.5 rounded-full border-2 border-current border-t-transparent"
                    style={{ animation: "v-orbit 0.7s linear infinite" }}
                    aria-hidden
                  />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="size-3.5" weight="bold" aria-hidden />
                  Browse for a file
                </>
              )}
            </Button>
          </div>

          {createMut.isError ? (
            <p
              className="max-w-md text-xs text-destructive animate-status-in"
              role="alert"
            >
              {String(createMut.error)}
            </p>
          ) : null}
        </div>
      </section>

      {/* ── Recent projects ── */}
      <section aria-label="Recent projects" className="space-y-3 animate-fade-up delay-150">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xs font-semibold tracking-tight text-foreground">
            <Lightning className="size-3.5 text-signal" weight="fill" aria-hidden />
            Recent projects
            {recentProjectPaths.length > 0 ? (
              <span className="font-mono text-[0.6rem] font-normal text-muted-foreground/70">
                ({recentProjectPaths.length})
              </span>
            ) : null}
          </h2>
        </div>

        {recentProjectPaths.length === 0 ? (
          <div className={cn(
            "flex flex-col items-center gap-3 border border-dashed border-border/50",
            "bg-muted/10 px-6 py-12 text-center",
            "animate-fade-in",
          )}>
            <div className="inline-flex size-10 items-center justify-center border border-border/50 bg-background/50 text-muted-foreground/50">
              <FilmStrip className="size-5" weight="duotone" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">No projects yet</p>
              <p className="text-[0.7rem] text-muted-foreground/60">
                Open or drop a media file above to get started.
              </p>
            </div>
          </div>
        ) : (
          <ul className="grid gap-1.5 [&>li]:min-w-0">
            {recentProjectPaths.map((p, i) => {
              const fileName = p.split(/[/\\]/).pop() || p
              const dirName = p.substring(0, p.length - fileName.length)
              const delayClass = i < 6
                ? [`delay-0`, `delay-50`, `delay-75`, `delay-100`, `delay-125`, `delay-150`][i]
                : "delay-150"

              return (
                <li
                  key={p}
                  className={cn(
                    "group/recent flex min-w-0 items-center overflow-hidden",
                    "border border-border/60 bg-card/50 transition-all duration-150",
                    "hover:border-signal/30 hover:bg-card/80 hover:shadow-[0_2px_12px_color-mix(in_oklab,var(--signal)_6%,transparent)]",
                    "animate-fade-up",
                    delayClass,
                  )}
                >
                  {/* Left accent bar */}
                  <span
                    className="h-full w-0.5 shrink-0 self-stretch bg-transparent transition-all duration-200 group-hover/recent:bg-signal"
                    aria-hidden
                  />

                  {/* File icon */}
                  <span className={cn(
                    "flex size-9 shrink-0 items-center justify-center mx-2",
                    "bg-muted/50 text-muted-foreground/60",
                    "transition-all duration-150",
                    "group-hover/recent:bg-signal-muted group-hover/recent:text-signal",
                  )}>
                    <FileVideo className="size-3.5" weight="duotone" aria-hidden />
                  </span>

                  {/* File info */}
                  <Link
                    to="/editor"
                    search={{ projectPath: p }}
                    className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden py-2.5 outline-none focus-visible:ring-1 focus-visible:ring-signal/50"
                    title={`Open ${fileName}`}
                  >
                    <span className="flex min-w-0 flex-1 flex-col leading-tight gap-0.5">
                      <span className="block min-w-0 truncate text-xs font-medium text-foreground">
                        {fileName}
                      </span>
                      <span className="block min-w-0 truncate font-mono text-[0.6rem] text-muted-foreground/60">
                        {dirName}
                      </span>
                    </span>
                    <ArrowRight
                      className={cn(
                        "mr-3 size-3.5 shrink-0 text-muted-foreground/30",
                        "translate-x-0 opacity-0 transition-all duration-150",
                        "group-hover/recent:translate-x-0.5 group-hover/recent:text-signal group-hover/recent:opacity-100",
                      )}
                      weight="bold"
                      aria-hidden
                    />
                  </Link>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 px-2">
                    <Link
                      to="/editor"
                      search={{ projectPath: p }}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "xs" }),
                        "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <FolderOpen className="size-3" weight="duotone" aria-hidden />
                      Open
                    </Link>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      className="text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeRecentProject(p)}
                      title="Remove from recent list"
                      aria-label={`Remove ${fileName} from recent`}
                    >
                      <Trash className="size-3" weight="duotone" aria-hidden />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ── Footer tip ── */}
      <p className="flex items-center gap-2 border-t border-border/40 pt-4 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground/50 animate-fade-up delay-200">
        <FilmStrip className="size-3 shrink-0" weight="duotone" aria-hidden />
        Keep media in Documents or Videos for default Tauri filesystem access.
      </p>
    </div>
  )
}
