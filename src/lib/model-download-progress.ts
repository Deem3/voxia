import type { ModelProgressPayload } from "@/types/voxia"

export type ModelDownloadProgressView = {
  percent: number
  bytesReceived: number
  totalBytes: number | null
  phaseLabel: string
}

export const modelDownloadProgressView = (
  payload: ModelProgressPayload,
): ModelDownloadProgressView => {
  const bytesReceived = Number(payload.bytesReceived)
  let totalBytes =
    payload.totalBytes != null && payload.totalBytes > 0
      ? Number(payload.totalBytes)
      : null

  if (totalBytes != null && bytesReceived > totalBytes) {
    totalBytes = bytesReceived
  }

  let percent = 0
  if (payload.phase === "complete") {
    percent = 100
  } else if (totalBytes != null && totalBytes > 0) {
    percent = Math.min(99, Math.round((bytesReceived / totalBytes) * 100))
  }

  return {
    percent,
    bytesReceived,
    totalBytes,
    phaseLabel: formatModelDownloadPhase(payload.phase),
  }
}

const formatModelDownloadPhase = (phase: string): string => {
  if (phase === "complete") return "Finishing up"
  const match = /^file (\d+)\/(\d+)$/.exec(phase)
  if (match) return `Downloading file ${match[1]} of ${match[2]}`
  return phase
}
