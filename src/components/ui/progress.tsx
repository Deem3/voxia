import * as React from "react"

import { cn } from "@/lib/utils"

type ProgressProps = React.ComponentProps<"div"> & {
  value?: number
  /** When true, shows an indeterminate animated bar instead of a value-based bar */
  indeterminate?: boolean
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indeterminate = false, ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, value))

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-busy={indeterminate || (clamped > 0 && clamped < 100)}
        className={cn(
          "relative h-1.5 w-full overflow-hidden bg-muted/70",
          className,
        )}
        {...props}
      >
        {indeterminate ? (
          <div
            className="absolute inset-y-0 left-0 w-[40%] origin-left rounded-full"
            style={{
              background: `linear-gradient(to right, transparent, var(--signal) 50%, transparent)`,
              animation: "v-progress-indeterminate 1.4s cubic-bezier(0.4,0,0.2,1) infinite",
            }}
          />
        ) : (
          <div
            className={cn(
              "relative h-full origin-left rounded-full transition-[width] duration-300 ease-out",
              clamped < 100 ? "shimmer" : "",
            )}
            style={{
              width: `${clamped}%`,
              background: clamped === 100
                ? "var(--signal)"
                : `linear-gradient(to right, color-mix(in oklab, var(--signal) 70%, var(--primary)), var(--signal))`,
            }}
          />
        )}
        {/* Subtle inner highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-30"
          style={{ background: "linear-gradient(to right, transparent, var(--signal), transparent)" }}
          aria-hidden
        />
      </div>
    )
  },
)
Progress.displayName = "Progress"

export { Progress }
