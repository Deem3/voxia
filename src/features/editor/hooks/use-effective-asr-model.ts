import { useEffect, useMemo } from "react"

import type { ModelRow } from "@/types/voxia"

/** Whisper model preference order when the user's selection isn't installed. */
const PREFERRED_FALLBACK = ["base", "small", "tiny"] as const

type Args = {
  installedModels: ModelRow[]
  modelId: string
  setModelId: (id: string) => void
}

/**
 * Resolve the Whisper model id to use: the user's selection if installed,
 * otherwise the first preferred fallback that is installed, otherwise the
 * first installed model. Keeps the `modelId` state in sync with the resolved value.
 */
export const useEffectiveAsrModel = ({
  installedModels,
  modelId,
  setModelId,
}: Args): string => {
  const effective = useMemo(() => {
    if (installedModels.length === 0) return ""
    if (installedModels.some((m) => m.id === modelId)) return modelId
    return (
      PREFERRED_FALLBACK.find((id) =>
        installedModels.some((m) => m.id === id),
      ) ??
      installedModels[0]?.id ??
      ""
    )
  }, [installedModels, modelId])

  useEffect(() => {
    if (effective && effective !== modelId) {
      setModelId(effective)
    }
  }, [effective, modelId, setModelId])

  return effective
}
