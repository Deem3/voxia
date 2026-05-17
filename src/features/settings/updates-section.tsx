"use client"

import { getVersion } from "@tauri-apps/api/app"
import type { Update } from "@tauri-apps/plugin-updater"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { checkForUpdates, installUpdate } from "@/lib/updater"

type UpdateStatus =
  | "idle"
  | "checking"
  | "current"
  | "available"
  | "installing"
  | "error"

export const UpdatesSection = () => {
  const [appVersion, setAppVersion] = useState("")
  const [status, setStatus] = useState<UpdateStatus>("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null)
  const [pendingVersion, setPendingVersion] = useState<string | null>(null)
  const [downloadHint, setDownloadHint] = useState<string | null>(null)

  useEffect(() => {
    void getVersion()
      .then(setAppVersion)
      .catch(() => setAppVersion("0.1.0"))
  }, [])

  const handleCheckForUpdates = useCallback(async () => {
    setStatus("checking")
    setMessage(null)
    setPendingUpdate(null)
    setPendingVersion(null)
    setDownloadHint(null)

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

  const handleInstallUpdate = useCallback(async () => {
    if (!pendingUpdate) return

    setStatus("installing")
    setMessage("Downloading update…")
    setDownloadHint(null)

    const result = await installUpdate(pendingUpdate, (progress) => {
      if (progress.phase === "progress" && progress.downloaded != null) {
        setDownloadHint(`Downloaded ${progress.downloaded} bytes…`)
      }
      if (progress.phase === "finished") {
        setMessage("Installing update…")
      }
    })

    if (!result.ok) {
      setStatus("error")
      setMessage(result.message)
    }
  }, [pendingUpdate])

  const isInstalling = status === "installing"

  return (
    <section className="space-y-4" aria-labelledby="updates-heading">
      <h2 id="updates-heading" className="text-lg font-medium text-foreground">
        Updates
      </h2>
      <p className="text-sm text-muted-foreground">
        Check for signed application updates from GitHub Releases.
        {appVersion ? ` Current version: v${appVersion}.` : ""}
      </p>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Update actions">
        <Button
          type="button"
          variant="outline"
          disabled={status === "checking" || isInstalling}
          onClick={() => void handleCheckForUpdates()}
        >
          {status === "checking" ? "Checking…" : "Check for updates"}
        </Button>
        {status === "available" && pendingUpdate ? (
          <Button
            type="button"
            variant="default"
            disabled={isInstalling}
            onClick={() => void handleInstallUpdate()}
          >
            {isInstalling ? "Installing…" : `Install v${pendingVersion ?? ""}`}
          </Button>
        ) : null}
      </div>

      {message ? (
        <p
          className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
      {downloadHint ? <p className="text-xs text-muted-foreground">{downloadHint}</p> : null}
    </section>
  )
}
