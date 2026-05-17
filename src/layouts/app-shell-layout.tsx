"use client"

import { getVersion } from "@tauri-apps/api/app"
import { Books, GearSix } from "@phosphor-icons/react"
import { Link, Outlet, useRouterState } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { AppPageHeader } from "@/components/app-page-header"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Sidebar,
  SidebarContent,
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
          <div className="flex h-8 items-center gap-1 px-1 group-data-[collapsible=icon]:justify-center">
            <p className="min-w-0 flex-1 truncate px-1 text-sm font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              Voxia
            </p>
            <SidebarTrigger className="shrink-0" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigate</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/library" || pathname.startsWith("/editor")}
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
                  <SidebarMenuButton asChild isActive={pathname === "/settings"}>
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
      </Sidebar>
      <SidebarInset className="flex min-w-0 h-svh flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 md:px-4">
          <MobileSidebarTrigger />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              <div className="min-w-0 flex-1 overflow-hidden">
                <AppPageHeader />
              </div>
              {version ? (
                <Badge variant="secondary" className="hidden shrink-0 rounded-none font-mono text-[0.65rem] sm:inline-flex">
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
