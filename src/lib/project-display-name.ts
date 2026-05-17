/** Last path segment for UI labels (project / media file name). */
export const projectDisplayName = (projectPath: string): string => {
  const trimmed = projectPath.trim()
  if (!trimmed) return "Untitled project"
  const parts = trimmed.split(/[/\\]/)
  return parts[parts.length - 1] || trimmed
}
