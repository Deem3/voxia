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
    modelsQuery.data?.whisper.some((m) => m.installed && (m.id === "base" || m.id === "small" || m.id === "tiny")) ??
    false

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
        /* e.g. non-Tauri web preview */
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
      filters: [
        {
          name: "Media",
          extensions: ["mp4", "mov", "mkv", "webm", "wav", "mp3"],
        },
      ],
    })
    if (picked === null) return
    const path = Array.isArray(picked) ? picked[0] : picked
    if (!path) return
    createMut.mutate(path)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Hero */}
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-1 w-8 bg-signal" aria-hidden />
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Project library
          </p>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Drop a video, ship a subtitle.
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Voxia transcribes, translates, and exports captions on your machine. Open a media file or drop one
          on this window to create a{" "}
          <code className="bg-muted/80 px-1 py-px font-mono text-foreground">.voxia.json</code> project beside it.
        </p>
      </header>

      {/* Whisper warning */}
      {!whisperReady && hydrated ? (
        <div
          role="status"
          className="flex flex-wrap items-start gap-3 border border-amber-500/40 bg-amber-500/5 p-4"
        >
          <WarningCircle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" weight="duotone" aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-foreground">Download a Whisper model first</p>
            <p className="text-xs text-muted-foreground">
              Transcription needs a local GGML model. In Settings → Models, install{" "}
              <span className="font-mono text-foreground">tiny</span> or{" "}
              <span className="font-mono text-foreground">base</span> to begin.
            </p>
          </div>
          <Link
            to="/settings"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
          >
            <GearSix className="size-4 shrink-0" weight="duotone" aria-hidden />
            Open settings
          </Link>
        </div>
      ) : null}

      {/* Drop / new project */}
      <section
        aria-label="Create new project"
        className={cn(
          "group relative overflow-hidden border-2 border-dashed border-border bg-card/40 transition-colors",
          fileDragActive
            ? "border-signal bg-signal-muted"
            : "hover:border-foreground/40 hover:bg-card/60",
        )}
      >
        <div className="absolute inset-0 bg-grid opacity-40 transition-opacity group-hover:opacity-60" aria-hidden />
        <div className="relative flex flex-col items-center gap-4 p-8 text-center sm:p-12">
          <span
            className={cn(
              "inline-flex size-14 items-center justify-center border bg-background transition-colors",
              fileDragActive ? "border-signal text-signal" : "border-border text-foreground/70",
            )}
            aria-hidden
          >
            <UploadSimple className="size-7" weight={fileDragActive ? "fill" : "duotone"} />
          </span>
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">
              {fileDragActive ? "Release to start a project" : "Drop a media file"}
            </p>
            <p className="text-xs text-muted-foreground">
              .mp4 .mov .mkv .webm .wav .mp3 — anywhere on this window
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={handleNewProject}
            disabled={createMut.isPending}
          >
            <Plus className="size-4" weight="bold" aria-hidden />
            {createMut.isPending ? "Creating…" : "Or browse for a file"}
          </Button>
          {createMut.isError ? (
            <p className="max-w-md text-xs text-destructive" role="alert">
              {String(createMut.error)}
            </p>
          ) : null}
        </div>
      </section>

      {/* Recent projects */}
      <section aria-label="Recent projects" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
            <Lightning className="size-4 text-signal" weight="fill" aria-hidden />
            Recent projects
            {recentProjectPaths.length > 0 ? (
              <span className="font-mono text-[0.65rem] font-normal text-muted-foreground">
                ({recentProjectPaths.length})
              </span>
            ) : null}
          </h2>
        </div>

        {recentProjectPaths.length === 0 ? (
          <div className="border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
            <FilmStrip className="mx-auto size-6 text-muted-foreground" weight="duotone" aria-hidden />
            <p className="mt-2 text-sm text-muted-foreground">No projects yet.</p>
            <p className="text-xs text-muted-foreground">
              Open or drop a media file above to get started.
            </p>
          </div>
        ) : (
          <ul className="grid gap-2 [&>li]:min-w-0">
            {recentProjectPaths.map((p) => {
              const fileName = p.split(/[/\\]/).pop() || p
              const dirName = p.substring(0, p.length - fileName.length)
              return (
                <li
                  key={p}
                  className="group/recent flex min-w-0 items-center gap-3 overflow-hidden border border-border bg-card pl-0 pr-3 transition-colors hover:border-signal/50 hover:bg-card"
                >
                  <span
                    className="h-full w-1 self-stretch bg-transparent transition-colors group-hover/recent:bg-signal"
                    aria-hidden
                  />
                  <Link
                    to="/editor"
                    search={{ projectPath: p }}
                    className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden py-2.5 outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    title={`Open ${fileName}`}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center bg-muted text-foreground/70 transition-colors group-hover/recent:bg-signal-muted group-hover/recent:text-signal">
                      <FileVideo className="size-4" weight="duotone" aria-hidden />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="block min-w-0 truncate text-sm font-medium text-foreground">
                        {fileName}
                      </span>
                      <span className="block min-w-0 truncate font-mono text-[0.65rem] text-muted-foreground">
                        {dirName}
                      </span>
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover/recent:translate-x-0 group-hover/recent:text-signal group-hover/recent:opacity-100"
                      weight="bold"
                      aria-hidden
                    />
                  </Link>
                  <Link
                    to="/editor"
                    search={{ projectPath: p }}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "shrink-0",
                    )}
                  >
                    <FolderOpen className="size-4 shrink-0" weight="duotone" aria-hidden />
                    Open
                  </Link>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeRecentProject(p)}
                    title="Remove from recent list"
                    aria-label={`Remove ${fileName} from recent`}
                  >
                    <Trash className="size-4" weight="duotone" aria-hidden />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <p className="flex items-center gap-2 border-t border-border pt-4 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
        <FilmStrip className="size-3.5 shrink-0" weight="duotone" aria-hidden />
        Tip — keep media in Documents or Videos for default Tauri filesystem scope.
      </p>
    </div>
  )
}
