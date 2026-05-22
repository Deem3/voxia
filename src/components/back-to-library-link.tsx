import { ArrowLeftIcon as ArrowLeft } from "@phosphor-icons/react"
import { Link } from "@tanstack/react-router"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type BackToLibraryLinkProps = {
  className?: string
  /** `prominent` — primary navigation; `toolbar` — compact row action */
  variant?: "prominent" | "toolbar"
}

export const BackToLibraryLink = ({
  className,
  variant = "prominent",
}: BackToLibraryLinkProps) => (
  <Link
    to="/library"
    className={cn(
      buttonVariants({
        variant: variant === "prominent" ? "ghost" : "ghost",
        size: "xs",
      }),
      "group/back inline-flex h-6 gap-1 px-1 text-muted-foreground hover:text-foreground",
      className,
    )}
    aria-label="Back to all projects in Library"
  >
    <ArrowLeft
      className="size-3.5 shrink-0 transition-transform group-hover/back:-translate-x-0.5"
      weight="bold"
      aria-hidden
    />
    <span className="text-[0.65rem] font-medium uppercase tracking-[0.18em]">
      All projects
    </span>
  </Link>
)
