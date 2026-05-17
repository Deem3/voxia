export type Cue = {
  id: string
  startMs: number
  endMs: number
  text: string
  translatedText?: string | null
}

export type VoxiaProject = {
  id: string
  videoPath: string
  createdAt: string
  cues: Cue[]
  language?: string | null
  modelId?: string | null
  /** Project-only caption size; when null/undefined, Settings `captionFontSizePx` applies */
  captionFontSizePx?: number | null
  /** Project-only caption box width (% of video width); null uses app default */
  captionMaxWidthPercent?: number | null
  /** Project-only caption font; when null/undefined, Settings `captionFontFamily` applies */
  captionFontFamily?: string | null
  /** Project-only caption anchor X (% of video width, ~5–95); null uses Settings default */
  captionPositionXPercent?: number | null
  /** Project-only caption anchor Y (% of video height, ~5–95); null uses Settings default */
  captionPositionYPercent?: number | null
  /** Project-only caption text color (hex); null uses Settings default */
  captionTextColor?: string | null
  /** Project-only caption panel background (hex); null uses Settings default */
  captionBackgroundColor?: string | null
  /** Project-only caption panel background opacity 0–1; null uses Settings default */
  captionBackgroundOpacity?: number | null
  /**
   * Legacy preset from older builds; ignored when `captionPosition*` are set.
   * Deserialized for migration only.
   */
  captionVerticalAlign?: string | null
}

export type ModelRow = {
  id: string
  kind: string
  displayName: string
  installed: boolean
  bytesOnDisk: number
  hasPartialDownload: boolean
  expectedSha256?: string | null
}

export type ListModelsResponse = {
  whisper: ModelRow[]
  nllb: ModelRow[]
}

export type CreateProjectResponse = {
  projectPath: string
  project: VoxiaProject
}

export type TranscribeResponse = {
  taskId: string
  project: VoxiaProject
}

export type ExportSubtitlesResponse = {
  outputPath: string
}

export type ModelProgressPayload = {
  kind: string
  id: string
  bytesReceived: number
  totalBytes?: number | null
  phase: string
}

export type TranscribeProgressPayload = {
  taskId: string
  percent: number
  lastText?: string | null
}

export type TranslateProgressPayload = {
  done: number
  total: number
  lastText?: string | null
}
