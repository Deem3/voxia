"use client"

import { getVersion } from "@tauri-apps/api/app"
import {
  ArrowClockwiseIcon as ArrowClockwise,
  CheckCircleIcon as CheckCircle,
  DownloadSimpleIcon as DownloadSimple,
  WarningCircleIcon as WarningCircle,
} from "@phosphor-icons/react"
import type { Update } from "@tauri-apps/plugin-updater"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { checkForUpdates, installUpdate } from "@/lib/updater"
import { cn } from "@/lib/utils"

type UpdateStatus = "idle" | "checking" | "current" | "available" | "installing" | "error"

export const UpdatesSection = () => {
  const [appVersion, setAppVersion] = useState("")
  const [status, setStatus] = useState<UpdateStatus>("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null)
  const [pendingVersion, setPendingVersion] = useState<string | null>(null)
  const [downloadBytes, setDownloadBytes] = useState<number | null>(null)
  const [contentLength, setContentLength] = useState<number | null>(null)

  useEffect(() => {
    void getVersion().then(setAppVersion).catch(() => setAppVersion("0.1.0"))
  }, [])

  const handleCheck = useCallback(async () => {
    setStatus("checking")
    setMessage(null)
    setPendingUpdate(null)
    setPendingVersion(null)
    setDownloadBytes(null)
    setContentLength(null)

    const result = await checkForUpdates()

    if (result.status === "current") {
      setStatus("current")
      setMessage("You are on the latest version.")
      return
    }
    if (result.status === "available") {
      setStatus("available")
      setPendingUpdate(result.update)
      setPendingVersion(result.version)
      setMessage(`Version ${result.version} is available.`)
      return
    }
    if (result.status === "error") {
      setStatus("error")
      setMessage(result.message)
      return
    }

    setStatus("current")
    setMessage("You are on the latest version.")
  }, [])

  const handleInstall = useCallback(async () => {
    if (!pendingUpdate) return
    setStatus("installing")
    setMessage("Downloading update…")
    let accumulated = 0

    const result = await installUpdate(pendingUpdate, (progress) => {
      if (progress.phase === "started") {
        setContentLength(progress.contentLength ?? null)
      }
      if (progress.phase === "progress" && progress.downloaded != null) {
        accumulated += progress.downloaded
        setDownloadBytes(accumulated)
      }
      if (progress.phase === "finished") {
        setMessage("Installing…")
      }
    })

    if (!result.ok) {
      setStatus("error")
      setMessage(result.message)
    }
  }, [pendingUpdate])

  const downloadPercent =
    contentLength && downloadBytes ? Math.min(99, Math.round((downloadBytes / contentLength) * 100)) : null

  const isChecking = status === "checking"
  const isInstalling = status === "installing"

  return (
    <div className="space-y-4">
      {/* Current version */}
      <div className={cn(
        "flex items-center gap-3 border border-border/50 bg-card/20 px-3 py-2.5",
        status === "current" && "border-emerald-500/20 bg-emerald-500/5",
        status === "available" && "border-signal/20 bg-signal-muted/20",
        status === "error" && "border-destructive/20 bg-destructive/5",
      )}>
        <div className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center",
          status === "current" && "bg-emerald-500/10 text-emerald-500",
          status === "available" && "bg-signal-muted text-signal",
          status === "error" && "bg-destructive/10 text-destructive",
          (status === "idle" || status === "checking" || status === "installing") && "bg-muted/30 text-muted-foreground/60",
        )}>
          {status === "current" ? (
            <CheckCircle className="size-4" weight="fill" aria-hidden />
          ) : status === "available" ? (
            <DownloadSimple className="size-4" weight="duotone" aria-hidden />
          ) : status === "error" ? (
            <WarningCircle className="size-4" weight="duotone" aria-hidden />
          ) : (
            <ArrowClockwise
              className={cn("size-4", isChecking && "animate-spin")}
              weight="duotone"
              aria-hidden
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground">
            {appVersion ? `Voxia v${appVersion}` : "Voxia"}
          </p>
          {message ? (
            <p className={cn(
              "text-[0.65rem]",
              status === "error" ? "text-destructive/80" : "text-muted-foreground/70",
            )}>
              {message}
            </p>
          ) : (
            <p className="text-[0.65rem] text-muted-foreground/50">
              {isChecking ? "Checking for updates…" : "Click to check for updates"}
            </p>
          )}
        </div>
      </div>

      {/* Download progress */}
      {isInstalling && downloadPercent !== null ? (
        <div className="space-y-1.5 animate-fade-in">
          <Progress value={downloadPercent} aria-label="Update download progress" />
          <p className="font-mono text-[0.6rem] text-muted-foreground/60">
            Downloading update… {downloadPercent}%
          </p>
        </div>
      ) : isInstalling ? (
        <Progress indeterminate aria-label="Installing update" />
      ) : null}

      {/* Actions */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Update actions">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isChecking || isInstalling}
          onClick={() => void handleCheck()}
          className="gap-1.5"
        >
          <ArrowClockwise
            className={cn("size-3.5", isChecking && "animate-spin")}
            weight="duotone"
            aria-hidden
          />
          {isChecking ? "Checking…" : "Check for updates"}
        </Button>

        {status === "available" && pendingUpdate ? (
          <Button
            type="button"
            variant="signal"
            size="sm"
            disabled={isInstalling}
            onClick={() => void handleInstall()}
            className="gap-1.5 animate-status-in"
          >
            <DownloadSimple className="size-3.5" weight="duotone" aria-hidden />
            {isInstalling ? "Installing…" : `Install v${pendingVersion ?? ""}`}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
