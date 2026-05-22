import { BooksIcon as Books, CaretRightIcon as CaretRight, GearSixIcon as GearSix } from "@phosphor-icons/react"
import { Link, useRouterState } from "@tanstack/react-router"

import { projectDisplayName } from "@/lib/project-display-name"
import { cn } from "@/lib/utils"

const editorProjectPathFromSearch = (search: unknown): string | null => {
  if (typeof search !== "object" || search === null) return null
  const path = (search as { projectPath?: unknown }).projectPath
  return typeof path === "string" && path.trim() !== "" ? path : null
}

export const AppPageHeader = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const search = useRouterState({ select: (s) => s.location.search })

  if (pathname === "/library") {
    return (
      <div className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden">
        <Books className="size-4 shrink-0 text-primary" weight="duotone" aria-hidden />
        <span className="min-w-0 truncate text-sm font-medium text-foreground">Library</span>
      </div>
    )
  }

  if (pathname === "/settings") {
    return (
      <div className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden">
        <GearSix className="size-4 shrink-0 text-primary" weight="duotone" aria-hidden />
        <span className="min-w-0 truncate text-sm font-medium text-foreground">Settings</span>
      </div>
    )
  }

  if (pathname.startsWith("/editor")) {
    const projectPath = editorProjectPathFromSearch(search)
    const label = projectPath ? projectDisplayName(projectPath) : "Editor"

    return (
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 max-w-full flex-1 items-center gap-1 overflow-hidden text-sm"
      >
        <Link
          to="/library"
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-sm text-muted-foreground",
            "underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          )}
          title="Back to project list"
        >
          <Books className="size-4" weight="duotone" aria-hidden />
          <span className="hidden sm:inline">Library</span>
        </Link>
        <CaretRight className="size-3 shrink-0 text-muted-foreground" aria-hidden />
        <span
          className="min-w-0 flex-1 truncate font-medium text-foreground"
          title={projectPath ?? label}
        >
          {label}
        </span>
      </nav>
    )
  }

  return (
    <span className="block min-w-0 max-w-full truncate text-sm font-medium text-foreground">
      Voxia
    </span>
  )
}
