/** Extensions accepted for new projects (aligned with library file picker). */
export const NEW_PROJECT_MEDIA_EXTENSIONS = [
  "mp4",
  "mov",
  "mkv",
  "webm",
  "wav",
  "mp3",
] as const

const extSet = new Set<string>(NEW_PROJECT_MEDIA_EXTENSIONS)

export const isSupportedNewProjectMediaPath = (path: string): boolean => {
  const i = path.lastIndexOf(".")
  if (i < 0 || i === path.length - 1) return false
  const ext = path.slice(i + 1).toLowerCase()
  return extSet.has(ext)
}

/** First dropped path whose extension is supported, or null. */
export const pickFirstSupportedMediaPath = (paths: string[]): string | null => {
  for (const p of paths) {
    if (isSupportedNewProjectMediaPath(p)) return p
  }
  return null
}
