import { listen, type UnlistenFn } from "@tauri-apps/api/event"
import type {
  ModelProgressPayload,
  TranscribeProgressPayload,
  TranslateProgressPayload,
} from "@/types/voxia"

export const listenModelProgress = (cb: (p: ModelProgressPayload) => void) =>
  listen<ModelProgressPayload>("voxia:model-progress", (e) => cb(e.payload))

export const listenTranscribeProgress = (cb: (p: TranscribeProgressPayload) => void) =>
  listen<TranscribeProgressPayload>("voxia:transcribe-progress", (e) => cb(e.payload))

export const listenTranslateProgress = (cb: (p: TranslateProgressPayload) => void) =>
  listen<TranslateProgressPayload>("voxia:translate-progress", (e) => cb(e.payload))

export type EventListeners = {
  unlisten: UnlistenFn[]
}

export const attachVoxiaEventLog = async (log: (s: string) => void): Promise<EventListeners> => {
  const un: UnlistenFn[] = []
  un.push(
    await listenModelProgress((p) =>
      log(`[model] ${p.kind}/${p.id} ${p.phase} ${p.bytesReceived}/${p.totalBytes ?? "?"}`),
    ),
  )
  un.push(
    await listenTranscribeProgress((p) => log(`[asr] ${p.taskId} ${p.percent}%`)),
  )
  un.push(
    await listenTranslateProgress((p) => log(`[tr] ${p.done}/${p.total}`)),
  )
  return { unlisten: un }
}
