import { useMutation } from "@tanstack/react-query"

import { exportSubtitles } from "@/lib/commands"

export type ExportFormat = "srt" | "vtt"
export type ExportMode = "original" | "translated" | "bilingual"

type Args = {
  projectPath: string | null
  format: ExportFormat
  mode: ExportMode
  onSuccess?: () => void
}

/** Subtitle export mutation. Calls `onSuccess` after a successful save dialog. */
export const useExportSubtitlesMutation = ({
  projectPath,
  format,
  mode,
  onSuccess,
}: Args) =>
  useMutation({
    mutationFn: async () => {
      if (!projectPath) throw new Error("missing project")
      return exportSubtitles({
        projectPath,
        format,
        mode,
        outputPath: null,
      })
    },
    onSuccess: () => {
      onSuccess?.()
    },
  })
