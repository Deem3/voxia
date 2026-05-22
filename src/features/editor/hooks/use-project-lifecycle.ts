import { useEffect } from "react"

import { useEditorStore } from "@/store/useEditorStore"
import { usePlayerStore } from "@/store/usePlayerStore"

type Args = {
  projectPath: string | null
  onProjectLoaded?: () => void
}

/**
 * Loads the project for the given path, resets the player on success, and
 * persists pending edits via `saveNow` on unmount or when the path changes.
 * `onProjectLoaded` runs once after a successful load (e.g. to clear selection).
 */
export const useProjectLifecycle = ({ projectPath, onProjectLoaded }: Args) => {
  useEffect(() => {
    if (!projectPath) {
      useEditorStore.getState().reset()
      return
    }

    let cancelled = false
    void (async () => {
      try {
        await useEditorStore.getState().load(projectPath)
        if (cancelled) return
        const player = usePlayerStore.getState()
        player.setCurrentTimeMs(0)
        player.setDurationMs(0)
        player.setPlaying(false)
        onProjectLoaded?.()
      } catch (e) {
        console.error(e)
        useEditorStore.getState().reset()
      }
    })()

    return () => {
      cancelled = true
      void useEditorStore.getState().saveNow()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectPath])
}
