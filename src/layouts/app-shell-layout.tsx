"use client"

import { getVersion } from "@tauri-apps/api/app"
import { BooksIcon as Books, GearSixIcon as GearSix } from "@phosphor-icons/react"
import { Link, Outlet, useRouterState } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { AppPageHeader } from "@/components/app-page-header"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { useSettingsStore } from "@/store/useSettingsStore"

const MobileSidebarTrigger = () => {
  const { isMobile } = useSidebar()
  if (!isMobile) return null
  return <SidebarTrigger className="-ms-1 shrink-0" />
}

const BrandMark = () => (
  <span
    className="inline-flex size-7 shrink-0 items-center justify-center bg-foreground/5 shadow-[2px_2px_0_0_var(--signal)] transition-shadow group-hover:shadow-[3px_3px_0_0_var(--signal)]"
    aria-hidden
  >
    <img
      src="/voxia-icon.png"
      alt=""
      width={20}
      height={20}
      className="size-5 object-contain"
      draggable={false}
    />
  </span>
)

export const AppShellLayout = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [version, setVersion] = useState("")

  useEffect(() => {
    void useSettingsStore.getState().hydrate()
  }, [])

  useEffect(() => {
    void getVersion()
      .then(setVersion)
      .catch(() => setVersion("0.1.0"))
  }, [])

  return (
    <TooltipProvider delayDuration={300}>
      <SidebarProvider>
        <Sidebar
          collapsible="icon"
          variant="sidebar"
          className="border-r border-sidebar-border"
        >
          <SidebarHeader className="border-b border-sidebar-border p-2">
            <div className="flex h-8 items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <span className="group-data-[collapsible=icon]:hidden">
                <BrandMark />
              </span>
              <div className="min-w-0 flex-1 leading-none group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                  Voxia
                </p>
                <p className="truncate text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Subtitle Studio
                </p>
              </div>
              <SidebarTrigger className="shrink-0" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-[0.6rem] uppercase tracking-[0.18em]">
                Workspace
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/library" || pathname.startsWith("/editor")}
                      tooltip="Library"
                    >
                      <Link
                        to="/library"
                        title={
                          pathname.startsWith("/editor")
                            ? "Back to all projects"
                            : "Project library"
                        }
                        aria-current={
                          pathname === "/library" || pathname.startsWith("/editor")
                            ? "page"
                            : undefined
                        }
                      >
                        <Books className="size-4" weight="duotone" aria-hidden />
                        <span>
                          {pathname.startsWith("/editor") ? "All projects" : "Library"}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/settings"}
                      tooltip="Settings"
                    >
                      <Link to="/settings" aria-current={pathname === "/settings" ? "page" : undefined}>
                        <GearSix className="size-4" weight="duotone" aria-hidden />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border p-2">
            <div className="flex items-center justify-between gap-2 px-1 group-data-[collapsible=icon]:hidden">
              <span className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                Build
              </span>
              {version ? (
                <span className="font-mono text-[0.65rem] text-muted-foreground">
                  v{version}
                </span>
              ) : null}
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex min-w-0 h-svh flex-col bg-background">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-sm md:px-4">
            <MobileSidebarTrigger />
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <AppPageHeader />
                </div>
                {version ? (
                  <Badge
                    variant="outline"
                    className="hidden shrink-0 rounded-none border-border bg-background font-mono text-[0.65rem] sm:inline-flex"
                  >
                    v{version}
                  </Badge>
                ) : null}
              </div>
              <ModeToggle />
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-none p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
