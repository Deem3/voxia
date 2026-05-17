"use client"

import { getCurrentWebview } from "@tauri-apps/api/webview"
import { open } from "@tauri-apps/plugin-dialog"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { FilmStrip, FolderOpen, GearSix, Plus, FileVideo, Trash } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a video or <span className="font-medium text-foreground/90">drop a media file on this window</span> to create a{" "}
          <code className="font-mono text-foreground">.voxia.json</code> project beside it, then edit in the editor.
        </p>
      </div>

      {!whisperReady && hydrated ? (
        <Card className="rounded-none border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Download a Whisper model</CardTitle>
            <CardDescription>
              Transcription needs a local GGML model. In Settings → Models, install <span className="font-mono">tiny</span> or{" "}
              <span className="font-mono">base</span> first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/settings" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
              <GearSix className="size-4 shrink-0" weight="duotone" aria-hidden />
              Open settings
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Card
        className={cn(
          "rounded-none border-border transition-colors",
          fileDragActive && "border-primary bg-primary/5 ring-2 ring-primary/30",
        )}
      >
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>New project</CardTitle>
            <CardDescription>
              Pick a video or audio file, or drop one anywhere on this window while Library is open.
            </CardDescription>
          </div>
          <Button type="button" size="sm" onClick={handleNewProject} disabled={createMut.isPending}>
            <Plus className="size-4" weight="duotone" aria-hidden />
            {createMut.isPending ? "Creating…" : "Open media file"}
          </Button>
        </CardHeader>
        {createMut.isError ? (
          <CardContent>
            <p className="text-xs text-destructive">{String(createMut.error)}</p>
          </CardContent>
        ) : null}
      </Card>

      <Card className="rounded-none border-border">
        <CardHeader>
          <CardTitle>Recent projects</CardTitle>
          <CardDescription>Quick access to projects you opened on this device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentProjectPaths.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent projects yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentProjectPaths.map((p) => {
                const fileName = p.split(/[\/\\]/).pop() || p
                const dirName = p.substring(0, p.length - fileName.length)
                return (
                  <li
                    key={p}
                    className="group flex items-center justify-between gap-4 rounded-md border border-border bg-card p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileVideo className="size-5" weight="duotone" aria-hidden />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">
                          {fileName}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {dirName}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Link
                        to="/editor"
                        search={{ projectPath: p }}
                        className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                        title={`Open project: ${fileName}`}
                      >
                        <FolderOpen className="size-4 shrink-0" weight="duotone" aria-hidden />
                        Open
                      </Link>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeRecentProject(p)}
                        title="Remove from recent list"
                        aria-label={`Remove ${fileName} from recent`}
                      >
                        <Trash className="size-4" weight="duotone" aria-hidden />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <FilmStrip className="size-4 shrink-0" weight="duotone" aria-hidden />
        Tip: keep media files in Documents or Videos so Tauri can read them with the default filesystem scope.
      </p>
    </div>
  )
}
