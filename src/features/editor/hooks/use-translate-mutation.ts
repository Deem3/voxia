import { useMutation } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { translateCues } from "@/lib/commands"
import { listenTranslateProgress } from "@/lib/events"
import {
  formatNotifyError,
  notifyTaskFailed,
  notifyTaskStarted,
  notifyTaskSucceeded,
} from "@/lib/notifications"
import { useEditorStore } from "@/store/useEditorStore"

type Args = {
  projectPath: string | null
  provider: string
  sourceLang: string
  targetLang: string
}

export type TranslateProgress = { done: number; total: number }

/**
 * Translation mutation with a live "done / total" progress channel. The mutation
 * accepts an optional cue-index list (or `null` to translate all cues) and
 * updates the editor project on success.
 */
export const useTranslateMutation = ({
  projectPath,
  provider,
  sourceLang,
  targetLang,
}: Args) => {
  const setProject = useEditorStore((s) => s.setProject)
  const [progress, setProgress] = useState<TranslateProgress | null>(null)

  useEffect(() => {
    let un: (() => void) | undefined
    void listenTranslateProgress((p) => {
      const done = Number(p.done)
      const total = Number(p.total)
      if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return
      setProgress({ done, total })
    }).then((u) => {
      un = u
    })
    return () => {
      un?.()
    }
  }, [])

  const mutation = useMutation({
    mutationFn: async (cueIndices: number[] | null) => {
      if (!projectPath) throw new Error("missing project")
      return translateCues({
        projectPath,
        providerId: provider,
        src: sourceLang,
        tgt: targetLang,
        cueIndices,
      })
    },
    onMutate: (cueIndices) => {
      const totalCues = useEditorStore.getState().project?.cues.length ?? 0
      const count = cueIndices?.length ?? totalCues
      setProgress(count > 0 ? { done: 0, total: count } : null)
      void notifyTaskStarted(
        "Translation started",
        count > 0
          ? `Translating ${count} cue${count === 1 ? "" : "s"} via ${provider}`
          : `Translating via ${provider}`,
      )
    },
    onSuccess: (proj, cueIndices) => {
      setProject(proj)
      const count = cueIndices?.length ?? proj.cues.length
      setProgress(count > 0 ? { done: count, total: count } : null)
      void notifyTaskSucceeded(
        "Translation complete",
        `${count} cue${count === 1 ? "" : "s"} updated`,
      )
    },
    onError: (error) => {
      void notifyTaskFailed("Translation failed", formatNotifyError(error))
    },
    onSettled: () => {
      setProgress(null)
    },
  })

  return { mutation, progress }
}
