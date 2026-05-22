import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

import { transcribeProject } from "@/lib/commands"
import { listenModelProgress, listenTranscribeProgress } from "@/lib/events"
import {
  formatNotifyError,
  notifyTaskFailed,
  notifyTaskStarted,
  notifyTaskSucceeded,
} from "@/lib/notifications"
import { useEditorStore } from "@/store/useEditorStore"

type Args = {
  projectPath: string | null
  modelId: string
  language: string
}

export type TranscribeMutationState = {
  /** TanStack mutation. Call `.mutate()` to trigger transcription. */
  mutation: ReturnType<typeof useTranscribeMutation>["mutation"]
  /** Whisper progress percent (0–100). `null` while audio is still being extracted. */
  whisperPercent: number | null
  /** Bytes of decoded PCM audio observed during ffmpeg pre-processing. */
  pcmBytes: number | null
  /** Active task id while a run is in flight, used to issue cancel. */
  taskId: string | null
}

/**
 * Encapsulates the Whisper transcription mutation along with its two progress
 * channels (ffmpeg PCM bytes and Whisper percent). Pushes notifications and
 * updates the editor's project on success.
 */
export const useTranscribeMutation = ({
  projectPath,
  modelId,
  language,
}: Args) => {
  const queryClient = useQueryClient()
  const setProject = useEditorStore((s) => s.setProject)

  const [whisperPercent, setWhisperPercent] = useState<number | null>(null)
  const [pcmBytes, setPcmBytes] = useState<number | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)

  const taskIdRef = useRef<string | null>(null)
  const audioPrepRef = useRef(false)

  // Whisper progress events scoped to our taskId.
  useEffect(() => {
    let un: (() => void) | undefined
    void listenTranscribeProgress((p) => {
      if (taskIdRef.current && p.taskId === taskIdRef.current) {
        setPcmBytes(null)
        setWhisperPercent(p.percent)
      }
    }).then((u) => {
      un = u
    })
    return () => {
      un?.()
    }
  }, [])

  // ffmpeg PCM-bytes events while we're prepping audio.
  useEffect(() => {
    let un: (() => void) | undefined
    void listenModelProgress((p) => {
      if (!audioPrepRef.current) return
      if (p.kind === "ffmpeg" && p.id === "decode" && p.phase === "pcm") {
        setPcmBytes(Number(p.bytesReceived))
      }
    }).then((u) => {
      un = u
    })
    return () => {
      un?.()
    }
  }, [])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!projectPath) throw new Error("missing project")
      if (!modelId.trim()) {
        throw new Error(
          "No Whisper model is available. Install tiny or base in Settings → Models.",
        )
      }
      const id = crypto.randomUUID()
      taskIdRef.current = id
      setTaskId(id)
      return await transcribeProject({
        projectPath,
        modelId,
        language: language.trim() === "" ? null : language.trim(),
        taskId: id,
      })
    },
    onMutate: () => {
      audioPrepRef.current = true
      setWhisperPercent(null)
      setPcmBytes(null)
      void notifyTaskStarted(
        "Transcription started",
        "Extracting audio and running Whisper…",
      )
    },
    onSuccess: (res) => {
      setProject(res.project)
      void queryClient.invalidateQueries({ queryKey: ["listModels"] })
      setWhisperPercent(null)
      taskIdRef.current = null
      setTaskId(null)
      const cueCount = res.project.cues.length
      void notifyTaskSucceeded(
        "Transcription complete",
        `${cueCount} cue${cueCount === 1 ? "" : "s"} created`,
      )
    },
    onError: (error) => {
      setWhisperPercent(null)
      taskIdRef.current = null
      setTaskId(null)
      void notifyTaskFailed("Transcription failed", formatNotifyError(error))
    },
    onSettled: () => {
      audioPrepRef.current = false
      setPcmBytes(null)
    },
  })

  return { mutation, whisperPercent, pcmBytes, taskId }
}
