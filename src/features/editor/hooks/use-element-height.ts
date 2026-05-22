import { useEffect, useState, type RefObject } from "react"

/**
 * Observe an element's bounding-rect height in pixels. Returns `null` until first measurement.
 * Re-observes when `dependencyKey` changes (use it to reset between resources, e.g. when a project loads).
 */
export const useElementHeight = (
  ref: RefObject<HTMLElement | null>,
  dependencyKey: unknown = null,
): number | null => {
  const [heightPx, setHeightPx] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const h = Math.round(el.getBoundingClientRect().height)
      if (h > 0) setHeightPx(h)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependencyKey])

  return heightPx
}
