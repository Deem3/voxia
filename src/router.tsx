import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
} from "@tanstack/react-router"

import { AppShellLayout } from "@/layouts/app-shell-layout"
import { EditorPage } from "@/pages/editor-page"
import { LibraryPage } from "@/pages/library-page"
import { SettingsPage } from "@/pages/settings-page"

const rootRoute = createRootRoute({
  component: AppShellLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <Navigate to="/library" />,
})

const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/library",
  component: LibraryPage,
})

export const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/editor",
  validateSearch: (raw: Record<string, unknown>) => ({
    projectPath: typeof raw.projectPath === "string" ? raw.projectPath : "",
  }),
  component: EditorPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([indexRoute, libraryRoute, editorRoute, settingsRoute])

export const router = createRouter({
  routeTree,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
