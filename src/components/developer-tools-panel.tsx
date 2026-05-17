"use client"

import { useEffect, useRef, useState } from "react"

import { attachVoxiaEventLog } from "@/lib/events"
import {
  cancelTranscribe,
  clearProviderKey,
  createProject,
  downloadModel,
  exportSubtitles,
  hasProviderKey,
  listModels,
  setProviderKey,
  transcribeProject,
  translateCues,
} from "@/lib/commands"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEditorStore } from "@/store/useEditorStore"

export const DeveloperToolsPanel = () => {
  const [logLines, setLogLines] = useState<string[]>([])
  const [videoPath, setVideoPath] = useState("")
  const [projectPath, setProjectPath] = useState("")
  const [modelId, setModelId] = useState("tiny")
  const [taskId, setTaskId] = useState("")
  const listenersRef = useRef<{ unlisten: (() => void)[] } | null>(null)

  const appendLog = (s: string) => {
    setLogLines((prev) => [...prev.slice(-200), s])
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { unlisten } = await attachVoxiaEventLog((s) => {
        if (!cancelled) appendLog(s)
      })
      listenersRef.current = { unlisten }
    })()
    return () => {
      cancelled = true
      listenersRef.current?.unlisten.forEach((u) => void u())
    }
  }, [])

  const handleCreateProject = async () => {
    const res = await createProject(videoPath)
    setProjectPath(res.projectPath)
    appendLog(`create_project -> ${res.projectPath}`)
    await useEditorStore.getState().load(res.projectPath)
  }

  const handleListModels = async () => {
    const m = await listModels()
    appendLog(`list_models whisper=${m.whisper.length} nllb=${m.nllb.length}`)
  }

  const handleDownloadModel = async () => {
    appendLog("download_model tiny…")
    await downloadModel("whisper", "tiny")
    appendLog("download_model done")
  }

  const handleTranscribe = async () => {
    const res = await transcribeProject({
      projectPath,
      modelId,
      language: "auto",
    })
    setTaskId(res.taskId)
    appendLog(`transcribe task=${res.taskId} cues=${res.project.cues.length}`)
    useEditorStore.getState().setProject(res.project)
  }

  const handleCancelTranscribe = async () => {
    if (!taskId) return
    const ok = await cancelTranscribe(taskId)
    appendLog(`cancel_transcribe ${ok}`)
  }

  const handleTranslate = async () => {
    const p = await translateCues({
      projectPath,
      providerId: "azure",
      src: "en",
      tgt: "mn",
    })
    appendLog(`translate cues=${p.cues.length}`)
    useEditorStore.getState().setProject(p)
  }

  const handleExport = async () => {
    const out = `/tmp/voxia-dev-export.srt`
    const r = await exportSubtitles({
      projectPath,
      format: "srt",
      mode: "original",
      outputPath: out,
    })
    appendLog(`export -> ${r.outputPath}`)
  }

  return (
    <Card className="rounded-none border-border">
      <CardHeader>
        <CardTitle>Developer</CardTitle>
        <CardDescription>
          Rust integration smoke tools. Install <code className="text-foreground">ffmpeg</code> on PATH.
          Whisper needs <code className="text-foreground">cargo build -p voxia --features whisper</code> for
          real ASR.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dev-video-path">Video path</Label>
            <Input
              id="dev-video-path"
              value={videoPath}
              onChange={(e) => setVideoPath(e.currentTarget.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dev-project-path">Project path</Label>
            <Input
              id="dev-project-path"
              value={projectPath}
              onChange={(e) => setProjectPath(e.currentTarget.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="dev-model-id">Whisper model id</Label>
            <Input
              id="dev-model-id"
              value={modelId}
              onChange={(e) => setModelId(e.currentTarget.value)}
              autoComplete="off"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void handleCreateProject()}>
            create_project
          </Button>
          <Button type="button" variant="secondary" onClick={() => void handleListModels()}>
            list_models
          </Button>
          <Button type="button" variant="secondary" onClick={() => void handleDownloadModel()}>
            download tiny
          </Button>
          <Button type="button" variant="secondary" onClick={() => void handleTranscribe()}>
            transcribe_project
          </Button>
          <Button type="button" variant="secondary" onClick={() => void handleCancelTranscribe()}>
            cancel_transcribe
          </Button>
          <Button type="button" variant="secondary" onClick={() => void handleTranslate()}>
            translate_cues (azure)
          </Button>
          <Button type="button" variant="secondary" onClick={() => void handleExport()}>
            export_subtitles
          </Button>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Keyring (Azure)</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void setProviderKey("azure", "YOUR_KEY").then(() => appendLog("azure key set"))
              }
            >
              set azure key (edit source first)
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void hasProviderKey("azure").then((v) => appendLog(`has azure key: ${v}`))
              }
            >
              has azure key
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void clearProviderKey("azure").then(() => appendLog("azure key cleared"))
              }
            >
              clear azure key
            </Button>
          </div>
        </div>
        <pre
          className="max-h-96 overflow-auto rounded-none border border-border bg-muted p-3 font-mono text-xs text-foreground"
          tabIndex={0}
          aria-label="Event log"
        >
          {logLines.join("\n")}
        </pre>
      </CardContent>
    </Card>
  )
}
