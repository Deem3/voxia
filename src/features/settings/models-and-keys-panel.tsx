"use client"

import {
  ArrowClockwiseIcon as ArrowClockwise,
  CheckCircleIcon as CheckCircle,
  DownloadSimpleIcon as DownloadSimple,
  LockKeyIcon as LockKey,
  TrashIcon as Trash,
  WarningCircleIcon as WarningCircle,
} from "@phosphor-icons/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  deleteModel,
  downloadModel,
  hasProviderKey,
  listModels,
  setProviderKey,
  clearProviderKey,
} from "@/lib/commands"
import { listenModelProgress } from "@/lib/events"
import { modelDownloadProgressView } from "@/lib/model-download-progress"
import {
  formatNotifyError,
  notifyTaskFailed,
  notifyTaskStarted,
  notifyTaskSucceeded,
} from "@/lib/notifications"
import type { ModelProgressPayload, ModelRow as ModelRowData } from "@/types/voxia"
import { cn } from "@/lib/utils"

const fmtBytes = (n: number) => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

type BusyState = { kind: string; id: string; op: "download" | "delete" } | null

const ModelRow = ({
  row,
  kind,
  busy,
  downloadProgress,
  onDownload,
  onDelete,
}: {
  row: ModelRowData
  kind: string
  busy: BusyState
  downloadProgress: ModelProgressPayload | null
  onDownload: (id: string) => void
  onDelete: (id: string) => void
}) => {
  const isRowBusy = busy !== null && busy.kind === kind && busy.id === row.id
  const isDownloading = busy?.op === "download" && isRowBusy
  const isDeleting = busy?.op === "delete" && isRowBusy

  const progress =
    isDownloading && downloadProgress?.kind === kind && downloadProgress.id === row.id
      ? modelDownloadProgressView(downloadProgress)
      : isDownloading
        ? { percent: 0, bytesReceived: 0, totalBytes: null, phaseLabel: "Starting…" }
        : null

  return (
    <div className={cn(
      "flex items-start gap-3 border border-border/50 bg-card/30 p-3 transition-all duration-150",
      isDownloading && "border-signal/20 bg-signal-muted/20",
    )}>
      {/* Status icon */}
      <div className={cn(
        "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center",
        row.installed
          ? "bg-emerald-500/10 text-emerald-500"
          : row.hasPartialDownload
            ? "bg-amber-500/10 text-amber-500"
            : "bg-muted/30 text-muted-foreground/40",
      )}>
        {row.installed ? (
          <CheckCircle className="size-3.5" weight="fill" aria-hidden />
        ) : row.hasPartialDownload ? (
          <WarningCircle className="size-3.5" weight="duotone" aria-hidden />
        ) : (
          <DownloadSimple className="size-3.5" weight="duotone" aria-hidden />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-xs font-semibold text-foreground">{row.displayName}</span>
          <span className="font-mono text-[0.6rem] text-muted-foreground/60">{row.id}</span>
          {row.bytesOnDisk > 0 && (
            <span className="font-mono text-[0.58rem] text-muted-foreground/50">
              {fmtBytes(row.bytesOnDisk)}
              {row.hasPartialDownload && !row.installed ? " (partial)" : ""}
            </span>
          )}
        </div>

        {/* Status line */}
        {!progress && (
          <p className={cn(
            "text-[0.6rem] font-medium",
            row.installed
              ? "text-emerald-500/80"
              : row.hasPartialDownload
                ? "text-amber-500/80"
                : "text-muted-foreground/50",
          )}>
            {row.installed
              ? "Installed and ready"
              : row.hasPartialDownload
                ? "Partial download"
                : "Not downloaded"}
          </p>
        )}

        {/* Progress */}
        {progress ? (
          <div className="space-y-1 animate-fade-in">
            <Progress value={progress.percent} aria-label={`Download ${progress.percent}%`} />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.58rem] text-muted-foreground/70">
                {progress.phaseLabel}
              </span>
              <span className="font-mono text-[0.58rem] font-semibold text-signal">
                {progress.percent}%
              </span>
            </div>
            {progress.totalBytes != null && (
              <span className="font-mono text-[0.55rem] text-muted-foreground/50">
                {fmtBytes(progress.bytesReceived)} / {fmtBytes(progress.totalBytes)}
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          size="xs"
          variant="secondary"
          disabled={busy !== null}
          onClick={() => onDownload(row.id)}
          title={
            row.hasPartialDownload
              ? "Resume download"
              : row.installed
                ? "Re-download"
                : "Download"
          }
          className="gap-1"
        >
          {row.hasPartialDownload ? (
            <ArrowClockwise className="size-3 shrink-0" weight="duotone" aria-hidden />
          ) : (
            <DownloadSimple className="size-3 shrink-0" weight="duotone" aria-hidden />
          )}
          {isDownloading
            ? "…"
            : row.installed
              ? "Re-dl"
              : row.hasPartialDownload
                ? "Resume"
                : "Download"}
        </Button>

        {(row.installed || row.hasPartialDownload) && (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={busy !== null}
            onClick={() => onDelete(row.id)}
            title="Delete"
            className={cn(
              "text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10",
              isDeleting && "text-destructive animate-pulse",
            )}
          >
            <Trash className="size-3" weight="duotone" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  )
}

const KeySection = ({
  title,
  description,
  stored,
  placeholder,
  value,
  onChange,
  onSave,
  onClear,
  saveLabel = "Save",
}: {
  title: string
  description?: string
  stored: boolean
  placeholder: string
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onClear: () => void
  saveLabel?: string
}) => (
  <div className="space-y-2.5">
    <div className="flex items-center gap-2">
      <LockKey className="size-3.5 text-muted-foreground/60" weight="duotone" aria-hidden />
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <span className={cn(
        "ml-auto inline-flex items-center gap-1 px-1.5 py-0.5",
        "text-[0.55rem] font-medium uppercase tracking-wide",
        stored
          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border border-border/40 bg-muted/20 text-muted-foreground/50",
      )}>
        <span className={cn(
          "size-1.5 rounded-full",
          stored ? "bg-emerald-500" : "bg-muted-foreground/30",
        )} aria-hidden />
        {stored ? "Stored" : "Not set"}
      </span>
    </div>
    {description ? (
      <p className="text-[0.65rem] text-muted-foreground/60">{description}</p>
    ) : null}
    <div className="flex gap-1.5">
      <input
        type="password"
        className={cn(
          "h-8 min-w-0 flex-1 border border-input bg-background/80 px-2",
          "font-mono text-xs text-foreground placeholder:text-muted-foreground/40",
          "transition-colors hover:border-signal/40 focus:border-signal focus:outline-none",
        )}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      <Button type="button" size="sm" variant="secondary" onClick={onSave} disabled={!value.trim()}>
        {saveLabel}
      </Button>
      {stored && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onClear}
          className="text-muted-foreground/60 hover:text-destructive"
        >
          Clear
        </Button>
      )}
    </div>
  </div>
)

export const ModelsAndKeysPanel = () => {
  const queryClient = useQueryClient()
  const q = useQuery({ queryKey: ["listModels"], queryFn: listModels })
  const [busy, setBusy] = useState<BusyState>(null)
  const [downloadProgress, setDownloadProgress] = useState<ModelProgressPayload | null>(null)
  const [azureKey, setAzureKey] = useState("")
  const [azureRegion, setAzureRegion] = useState("")
  const [googleKey, setGoogleKey] = useState("")
  const [deepseekKey, setDeepseekKey] = useState("")
  const [hasAzure, setHasAzure] = useState(false)
  const [hasGoogle, setHasGoogle] = useState(false)
  const [hasDeepseek, setHasDeepseek] = useState(false)

  useEffect(() => {
    void hasProviderKey("azure").then(setHasAzure)
    void hasProviderKey("google").then(setHasGoogle)
    void hasProviderKey("deepseek").then(setHasDeepseek)
  }, [])

  useEffect(() => {
    let un: (() => void) | undefined
    void listenModelProgress((p) => setDownloadProgress(p)).then((u) => { un = u })
    return () => { un?.() }
  }, [])

  const dl = useMutation({
    mutationFn: async ({ kind, id }: { kind: string; id: string }) => {
      setBusy({ kind, id, op: "download" })
      await downloadModel(kind, id)
    },
    onMutate: ({ kind, id }) => { void notifyTaskStarted("Downloading model", `${kind}/${id}`) },
    onSuccess: (_data, { kind, id }) => { void notifyTaskSucceeded("Model downloaded", `${kind}/${id} ready`) },
    onError: (error, { kind, id }) => { void notifyTaskFailed("Download failed", `${kind}/${id}: ${formatNotifyError(error)}`) },
    onSettled: () => {
      setBusy(null)
      setDownloadProgress(null)
      void queryClient.invalidateQueries({ queryKey: ["listModels"] })
    },
  })

  const del = useMutation({
    mutationFn: async ({ kind, id }: { kind: string; id: string }) => {
      setBusy({ kind, id, op: "delete" })
      await deleteModel(kind, id)
    },
    onSettled: () => {
      setBusy(null)
      void queryClient.invalidateQueries({ queryKey: ["listModels"] })
    },
  })

  const handleDelete = (kind: string, id: string, displayName: string) => {
    if (!window.confirm(`Remove "${displayName || id}"? This cannot be undone.`)) return
    del.mutate({ kind, id })
  }

  return (
    <div className="space-y-8">
      {/* Models */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-foreground/80">AI Models</h3>
        <p className="text-[0.65rem] text-muted-foreground/60">
          Download Whisper GGML weights for transcription and NLLB bundles for local translation.
        </p>
        <Tabs defaultValue="whisper">
          <TabsList className="h-8 gap-px bg-muted/30 p-0.5">
            <TabsTrigger value="whisper" className="text-xs h-7">Whisper ASR</TabsTrigger>
            <TabsTrigger value="nllb" className="text-xs h-7">NLLB Translation</TabsTrigger>
          </TabsList>
          <TabsContent value="whisper" className="mt-3">
            {q.data ? (
              <div className="space-y-2">
                {q.data.whisper.map((r) => (
                  <ModelRow
                    key={r.id}
                    row={r}
                    kind="whisper"
                    busy={busy}
                    downloadProgress={downloadProgress}
                    onDownload={(id) => dl.mutate({ kind: "whisper", id })}
                    onDelete={(id) => handleDelete("whisper", id, r.displayName)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted/20 shimmer" />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="nllb" className="mt-3">
            {q.data ? (
              <div className="space-y-2">
                {q.data.nllb.map((r) => (
                  <ModelRow
                    key={r.id}
                    row={r}
                    kind="nllb"
                    busy={busy}
                    downloadProgress={downloadProgress}
                    onDownload={(id) => dl.mutate({ kind: "nllb", id })}
                    onDelete={(id) => handleDelete("nllb", id, r.displayName)}
                  />
                ))}
              </div>
            ) : (
              <div className="h-16 bg-muted/20 shimmer" />
            )}
          </TabsContent>
        </Tabs>
        {dl.isError && (
          <p className="text-[0.65rem] text-destructive animate-status-in">{String(dl.error)}</p>
        )}
        {del.isError && (
          <p className="text-[0.65rem] text-destructive animate-status-in">{String(del.error)}</p>
        )}
      </div>

      {/* API Keys */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-foreground/80">Cloud Translation Keys</h3>
          <p className="mt-0.5 text-[0.65rem] text-muted-foreground/60">
            Keys are stored in the OS keyring — never in plain text. Only key presence is shown here.
          </p>
        </div>
        <div className="space-y-5 border border-border/40 bg-card/20 p-4">
          <KeySection
            title="Azure Translator"
            placeholder="Ocp-Apim-Subscription-Key"
            stored={hasAzure}
            value={azureKey}
            onChange={setAzureKey}
            onSave={async () => {
              if (!azureKey.trim()) return
              await setProviderKey("azure", azureKey.trim())
              if (azureRegion.trim()) await setProviderKey("azure_region", azureRegion.trim())
              setAzureKey("")
              setHasAzure(true)
            }}
            onClear={async () => {
              await clearProviderKey("azure")
              await clearProviderKey("azure_region")
              setHasAzure(false)
            }}
            saveLabel="Save"
          />
          {/* Azure region sub-field */}
          <div className="space-y-1 -mt-3 pl-5">
            <label className="text-[0.58rem] font-medium uppercase tracking-[0.15em] text-muted-foreground/50">
              Region (optional)
            </label>
            <input
              className="h-7 w-full border border-input bg-background/60 px-2 font-mono text-xs placeholder:text-muted-foreground/30 focus:border-signal focus:outline-none"
              placeholder="eastus"
              value={azureRegion}
              onChange={(e) => setAzureRegion(e.target.value)}
              autoComplete="off"
              aria-label="Azure region"
            />
          </div>

          <div className="border-t border-border/30 pt-4">
            <KeySection
              title="Google Translate"
              description="Optional. Without a key, uses the free web endpoint. With a key, uses Google Cloud Translation v2."
              placeholder="Google Cloud API key"
              stored={hasGoogle}
              value={googleKey}
              onChange={setGoogleKey}
              onSave={async () => {
                if (!googleKey.trim()) return
                await setProviderKey("google", googleKey.trim())
                setGoogleKey("")
                setHasGoogle(true)
              }}
              onClear={async () => {
                await clearProviderKey("google")
                setHasGoogle(false)
              }}
            />
          </div>

          <div className="border-t border-border/30 pt-4">
            <KeySection
              title="DeepSeek"
              description="Required for the DeepSeek translation provider."
              placeholder="sk-…"
              stored={hasDeepseek}
              value={deepseekKey}
              onChange={setDeepseekKey}
              onSave={async () => {
                if (!deepseekKey.trim()) return
                await setProviderKey("deepseek", deepseekKey.trim())
                setDeepseekKey("")
                setHasDeepseek(true)
              }}
              onClear={async () => {
                await clearProviderKey("deepseek")
                setHasDeepseek(false)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
