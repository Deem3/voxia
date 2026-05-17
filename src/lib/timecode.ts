const pad2 = (n: number) => String(n).padStart(2, "0")

/** Formats milliseconds as `HH:MM:SS.mmm` */
export const formatMsHms = (ms: number): string => {
  if (!Number.isFinite(ms)) return "00:00:00.000"
  const sign = ms < 0 ? "-" : ""
  const t = Math.abs(Math.trunc(ms))
  const h = Math.floor(t / 3_600_000)
  const m = Math.floor((t % 3_600_000) / 60_000)
  const s = Math.floor((t % 60_000) / 1000)
  const frac = t % 1000
  return `${sign}${pad2(h)}:${pad2(m)}:${pad2(s)}.${String(frac).padStart(3, "0")}`
}

/** Parses `HH:MM:SS.mmm`, `MM:SS.mmm`, or `SS.mmm` into milliseconds */
export const parseHmsToMs = (raw: string): number | null => {
  const s = raw.trim()
  if (!s) return null
  const parts = s.split(":")
  try {
    if (parts.length === 3) {
      const h = Number(parts[0])
      const m = Number(parts[1])
      const sec = parts[2]
      if (!Number.isFinite(h) || !Number.isFinite(m) || sec === undefined) return null
      return parseSecFragment(h * 3600 + m * 60, sec)
    }
    if (parts.length === 2) {
      const m = Number(parts[0])
      const sec = parts[1]
      if (!Number.isFinite(m) || sec === undefined) return null
      return parseSecFragment(m * 60, sec)
    }
    return parseSecFragment(0, parts[0] ?? "")
  } catch {
    return null
  }
}

const parseSecFragment = (baseSec: number, secPart: string): number | null => {
  const [secStr, msStr] = secPart.split(/[.,]/)
  const sec = Number(secStr)
  if (!Number.isFinite(sec)) return null
  let ms = 0
  if (msStr !== undefined && msStr.length > 0) {
    const padded = `${msStr}000`.slice(0, 3)
    ms = Number(padded)
    if (!Number.isFinite(ms)) return null
  }
  return baseSec * 1000 + sec * 1000 + ms
}
