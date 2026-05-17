"use client"

import { ArrowClockwise, DownloadSimple, Trash } from "@phosphor-icons/react"
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
import type { ModelProgressPayload, ModelRow } from "@/types/voxia"

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

type BusyState = { kind: string; id: string; op: "download" | "delete" } | null

const ModelTable = ({
  rows,
  kind,
  busy,
  downloadProgress,
  onDownload,
  onDelete,
}: {
  rows: ModelRow[]
  kind: string
  busy: BusyState
  downloadProgress: ModelProgressPayload | null
  onDownload: (id: string) => void
  onDelete: (id: string) => void
}) => {
  const isRowBusy = (id: string) => busy !== null && busy.kind === kind && busy.id === id

  const rowDownloadProgress = (id: string) => {
    if (
      busy?.op !== "download" ||
      busy.kind !== kind ||
      busy.id !== id ||
      !downloadProgress ||
      downloadProgress.kind !== kind ||
      downloadProgress.id !== id
    ) {
      return null
    }
    return modelDownloadProgressView(downloadProgress)
  }

  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
          <tr>
            <th className="px-2 py-2">Model</th>
            <th className="px-2 py-2">Id</th>
            <th className="px-2 py-2">Status</th>
            <th className="px-2 py-2">Size</th>
            <th className="px-2 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isDownloading = busy?.op === "download" && isRowBusy(r.id)
            const progress =
              rowDownloadProgress(r.id) ??
              (isDownloading
                ? {
                    percent: 0,
                    bytesReceived: 0,
                    totalBytes: null,
                    phaseLabel: "Starting download…",
                  }
                : null)

            return (
              <tr key={r.id} className="border-b border-border last:border-0">
              <td className="px-2 py-2 text-foreground">{r.displayName}</td>
              <td className="px-2 py-2 font-mono text-muted-foreground">{r.id}</td>
              <td className="px-2 py-2">
                {progress ? (
                  <div className="min-w-[10rem] max-w-xs space-y-1.5">
                    <Progress value={progress.percent} aria-label={`Download ${progress.percent}%`} />
                    <p className="text-[0.65rem] leading-snug text-muted-foreground">
                      <span className="font-medium text-foreground">{progress.percent}%</span>
                      {" · "}
                      {formatBytes(progress.bytesReceived)}
                      {progress.totalBytes != null
                        ? ` / ${formatBytes(progress.totalBytes)}`
                        : null}
                    </p>
                    <p className="text-[0.65rem] text-muted-foreground">{progress.phaseLabel}</p>
                  </div>
                ) : r.installed ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Installed</span>
                ) : r.hasPartialDownload ? (
                  <span className="text-amber-600 dark:text-amber-400">
                    Partial ({formatBytes(r.bytesOnDisk)})
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-2 py-2 font-mono text-muted-foreground">
                {formatBytes(r.bytesOnDisk)}
                {r.hasPartialDownload && !r.installed ? (
                  <span className="ml-1 text-[0.65rem] text-muted-foreground">(partial)</span>
                ) : null}
              </td>
              <td className="px-2 py-2 text-right">
                <div className="flex flex-wrap justify-end gap-1">
                  <Button
                    type="button"
                    size="xs"
                    variant="secondary"
                    disabled={busy !== null}
                    onClick={() => onDownload(r.id)}
                    title={
                      r.hasPartialDownload
                        ? "Continue interrupted download"
                        : r.installed
                          ? "Download again"
                          : "Download model"
                    }
                  >
                    {r.hasPartialDownload ? (
                      <ArrowClockwise className="size-3.5 shrink-0" weight="duotone" aria-hidden />
                    ) : (
                      <DownloadSimple className="size-3.5 shrink-0" weight="duotone" aria-hidden />
                    )}
                    {isDownloading
                      ? "Downloading…"
                      : r.installed
                        ? "Re-download"
                        : r.hasPartialDownload
                          ? "Resume download"
                          : "Download"}
                  </Button>
                  {r.installed || r.hasPartialDownload ? (
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={busy !== null}
                      onClick={() => onDelete(r.id)}
                      title="Remove downloaded and partial files"
                    >
                      <Trash className="size-3.5 shrink-0" weight="duotone" aria-hidden />
                      {busy?.op === "delete" && isRowBusy(r.id) ? "Removing…" : "Delete"}
                    </Button>
                  ) : null}
                </div>
              </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export const ModelsAndKeysPanel = () => {
  const queryClient = useQueryClient()
  const q = useQuery({ queryKey: ["listModels"], queryFn: listModels })
  const [busy, setBusy] = useState<BusyState>(null)
  const [downloadProgress, setDownloadProgress] = useState<ModelProgressPayload | null>(null)
  const [azureKey, setAzureKey] = useState("")
  const [azureRegion, setAzureRegion] = useState("")
  const [googleKey, setGoogleKey] = useState("")
  const [hasAzure, setHasAzure] = useState(false)
  const [hasGoogle, setHasGoogle] = useState(false)

  useEffect(() => {
    void hasProviderKey("azure").then(setHasAzure)
    void hasProviderKey("google").then(setHasGoogle)
  }, [])

  useEffect(() => {
    let un: (() => void) | undefined
    void listenModelProgress((p) => {
      setDownloadProgress(p)
    }).then((u) => {
      un = u
    })
    return () => {
      un?.()
    }
  }, [])

  const dl = useMutation({
    mutationFn: async ({ kind, id }: { kind: string; id: string }) => {
      setBusy({ kind, id, op: "download" })
      await downloadModel(kind, id)
    },
    onMutate: ({ kind, id }) => {
      void notifyTaskStarted("Downloading model", `${kind}/${id}`)
    },
    onSuccess: (_data, { kind, id }) => {
      void notifyTaskSucceeded("Model downloaded", `${kind}/${id} is ready to use`)
    },
    onError: (error, { kind, id }) => {
      void notifyTaskFailed(
        "Model download failed",
        `${kind}/${id}: ${formatNotifyError(error)}`,
      )
    },
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

  const handleDeleteModel = (kind: string, id: string, displayName: string) => {
    const label = displayName || id
    const ok = window.confirm(`Remove downloaded files for “${label}” (${id})? This cannot be undone.`)
    if (!ok) return
    del.mutate({ kind, id })
  }

  const handleSaveAzure = async () => {
    if (!azureKey.trim()) return
    await setProviderKey("azure", azureKey.trim())
    if (azureRegion.trim()) {
      await setProviderKey("azure_region", azureRegion.trim())
    }
    setAzureKey("")
    setHasAzure(true)
  }

  const handleSaveGoogle = async () => {
    if (!googleKey.trim()) return
    await setProviderKey("google", googleKey.trim())
    setGoogleKey("")
    setHasGoogle(true)
  }

  return (
    <div className="space-y-10">
      <section className="space-y-3" aria-labelledby="models-heading">
        <h2 id="models-heading" className="text-lg font-medium text-foreground">
          Models
        </h2>
        <p className="text-sm text-muted-foreground">Download Whisper GGML weights and NLLB translation bundles.</p>
        <Tabs defaultValue="whisper">
          <TabsList aria-label="Model kind">
            <TabsTrigger value="whisper">Whisper</TabsTrigger>
            <TabsTrigger value="nllb">Translation (NLLB)</TabsTrigger>
          </TabsList>
          <TabsContent value="whisper">
            {q.data ? (
              <ModelTable
                rows={q.data.whisper}
                kind="whisper"
                busy={busy}
                downloadProgress={downloadProgress}
                onDownload={(id) => dl.mutate({ kind: "whisper", id })}
                onDelete={(id) => {
                  const row = q.data?.whisper.find((r) => r.id === id)
                  handleDeleteModel("whisper", id, row?.displayName ?? id)
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </TabsContent>
          <TabsContent value="nllb">
            {q.data ? (
              <ModelTable
                rows={q.data.nllb}
                kind="nllb"
                busy={busy}
                downloadProgress={downloadProgress}
                onDownload={(id) => dl.mutate({ kind: "nllb", id })}
                onDelete={(id) => {
                  const row = q.data?.nllb.find((r) => r.id === id)
                  handleDeleteModel("nllb", id, row?.displayName ?? id)
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </TabsContent>
        </Tabs>
        {dl.isError ? <p className="text-xs text-destructive">{String(dl.error)}</p> : null}
        {del.isError ? <p className="text-xs text-destructive">{String(del.error)}</p> : null}
      </section>

      <section className="space-y-4" aria-labelledby="keys-heading">
        <h2 id="keys-heading" className="text-lg font-medium text-foreground">
          Cloud translation keys
        </h2>
        <p className="text-sm text-muted-foreground">
          Keys are stored in the OS keyring, not in plugin-store. Only presence is shown here.
        </p>
        <div className="grid gap-6 border border-border bg-muted/10 p-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Azure Translator</p>
            <p className="text-xs text-muted-foreground">Stored: {hasAzure ? "yes" : "no"}</p>
            <input
              className="h-9 w-full border border-input bg-background px-2 font-mono text-xs"
              placeholder="Ocp-Apim-Subscription-Key"
              value={azureKey}
              onChange={(e) => setAzureKey(e.target.value)}
              autoComplete="off"
              aria-label="Azure subscription key"
            />
            <input
              className="h-9 w-full border border-input bg-background px-2 font-mono text-xs"
              placeholder="Region (optional, e.g. eastus)"
              value={azureRegion}
              onChange={(e) => setAzureRegion(e.target.value)}
              autoComplete="off"
              aria-label="Azure region"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={handleSaveAzure}>
                Save Azure key
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={async () => {
                  await clearProviderKey("azure")
                  await clearProviderKey("azure_region")
                  setHasAzure(false)
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Google Translate</p>
            <p className="text-xs text-muted-foreground">
              API key optional. Without a key, translation uses the free web endpoint. With a key,
              uses Google Cloud Translation. Stored: {hasGoogle ? "yes" : "no"}
            </p>
            <input
              className="h-9 w-full border border-input bg-background px-2 font-mono text-xs"
              placeholder="API key"
              value={googleKey}
              onChange={(e) => setGoogleKey(e.target.value)}
              autoComplete="off"
              aria-label="Google API key"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={handleSaveGoogle}>
                Save Google key
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={async () => {
                  await clearProviderKey("google")
                  setHasGoogle(false)
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
