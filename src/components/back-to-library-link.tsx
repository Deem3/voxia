import { ArrowLeftIcon as ArrowLeft } from "@phosphor-icons/react"
import { Link } from "@tanstack/react-router"

import { cn } from "@/lib/utils"

type BackToLibraryLinkProps = {
  className?: string
}

export const BackToLibraryLink = ({ className }: BackToLibraryLinkProps) => (
  <Link
    to="/library"
    className={cn(
      "group/back inline-flex h-6 items-center gap-1.5 text-muted-foreground/60",
      "transition-all duration-150 hover:text-foreground",
      "outline-none focus-visible:ring-1 focus-visible:ring-signal/50",
      className,
    )}
    aria-label="Back to library"
  >
    <ArrowLeft
      className="size-3 shrink-0 transition-transform duration-150 group-hover/back:-translate-x-0.5"
      weight="bold"
      aria-hidden
    />
    <span className="text-[0.58rem] font-semibold uppercase tracking-[0.2em]">
      All projects
    </span>
  </Link>
)
