import { BackToLibraryLink } from "@/components/back-to-library-link"

type EditorEmptyStateProps = {
  /** `missing` — no project selected; `loading` — project still loading. */
  variant: "missing" | "loading"
}

/** Placeholder shown before a project is selected or while it loads. */
export const EditorEmptyState = ({ variant }: EditorEmptyStateProps) => (
  <div className="mx-auto max-w-2xl space-y-4">
    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
      Editor
    </h1>
    <p className="text-sm text-muted-foreground">
      {variant === "missing"
        ? "Pick a project from the library to open the editor."
        : "Loading project…"}
    </p>
    {variant === "missing" ? <BackToLibraryLink /> : null}
  </div>
)
