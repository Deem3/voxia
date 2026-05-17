import { ArrowLeft, Books } from "@phosphor-icons/react"
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
        variant: variant === "prominent" ? "outline" : "ghost",
        size: variant === "prominent" ? "sm" : "sm",
      }),
      variant === "prominent" && "border-primary/30 bg-muted/30",
      className,
    )}
    aria-label="Back to all projects in Library"
  >
    <ArrowLeft className="size-4 shrink-0" weight="bold" aria-hidden />
    <Books className="size-4 shrink-0" weight="duotone" aria-hidden />
    <span>All projects</span>
  </Link>
)
