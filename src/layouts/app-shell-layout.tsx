"use client"

import { getVersion } from "@tauri-apps/api/app"
import {
  BooksIcon as Books,
  GearSixIcon as GearSix,
  WaveformIcon as Waveform,
  type Icon as PhosphorIcon,
  type IconWeight,
} from "@phosphor-icons/react"
import { Link, Outlet, useRouterState } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { AppPageHeader } from "@/components/app-page-header"
import { ModeToggle } from "@/components/mode-toggle"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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
import { cn } from "@/lib/utils"

const MobileSidebarTrigger = () => {
  const { isMobile } = useSidebar()
  if (!isMobile) return null
  return <SidebarTrigger className="-ms-1 shrink-0" />
}

const BrandMark = () => (
  <span
    className={cn(
      "inline-flex size-6 shrink-0 items-center justify-center",
      "bg-foreground text-background",
      "transition-all duration-200",
      "shadow-[2px_2px_0_0_var(--signal)]",
      "group-hover/brand:shadow-[3px_3px_0_0_var(--signal),0_0_12px_color-mix(in_oklab,var(--signal)_25%,transparent)]",
    )}
    aria-hidden
  >
    <Waveform className="size-3.5" weight="fill" />
  </span>
)

const NavItem = ({
  to,
  icon: Icon,
  label,
  isActive,
  tooltip,
}: {
  to: string
  icon: PhosphorIcon
  label: string
  isActive: boolean
  tooltip: string
}) => (
  <SidebarMenuItem>
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip={tooltip}
      className={cn(
        "relative transition-all duration-150",
        isActive && "text-signal font-medium",
      )}
    >
      <Link to={to} aria-current={isActive ? "page" : undefined}>
        <Icon
          className={cn(
            "size-4 transition-colors duration-150",
            isActive ? "text-signal" : "text-muted-foreground",
          )}
          weight={(isActive ? "duotone" : "regular") as IconWeight}
          aria-hidden
        />
        <span className={cn(
          "transition-colors duration-150",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}>
          {label}
        </span>
        {isActive && (
          <span
            className="absolute inset-y-1 left-0 w-[2px] bg-signal animate-scale-in origin-center"
            aria-hidden
          />
        )}
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
)

export const AppShellLayout = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [version, setVersion] = useState("")

  const isLibraryOrEditor = pathname === "/library" || pathname.startsWith("/editor")
  const isSettings = pathname === "/settings"

  useEffect(() => {
    void useSettingsStore.getState().hydrate()
  }, [])

  useEffect(() => {
    void getVersion()
      .then(setVersion)
      .catch(() => setVersion("0.1.0"))
  }, [])

  return (
    <TooltipProvider delayDuration={250}>
      <SidebarProvider>
        <Sidebar
          collapsible="icon"
          variant="sidebar"
          className="border-r border-sidebar-border/80"
        >
          {/* Brand header */}
          <SidebarHeader className="border-b border-sidebar-border/60 p-2">
            <div className="group/brand flex h-8 items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <span className="group-data-[collapsible=icon]:hidden">
                <BrandMark />
              </span>
              <div className="min-w-0 flex-1 leading-none group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                  Voxia
                </p>
                <p className="truncate text-[0.55rem] font-medium uppercase tracking-[0.22em] text-muted-foreground/70">
                  Subtitle Studio
                </p>
              </div>
              <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground transition-colors" />
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="px-1 py-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  <NavItem
                    to="/library"
                    icon={Books}
                    label={pathname.startsWith("/editor") ? "All projects" : "Library"}
                    isActive={isLibraryOrEditor}
                    tooltip="Library"
                  />
                  <NavItem
                    to="/settings"
                    icon={GearSix}
                    label="Settings"
                    isActive={isSettings}
                    tooltip="Settings"
                  />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Footer with version */}
          <SidebarFooter className="border-t border-sidebar-border/60 p-2">
            <div className="group-data-[collapsible=icon]:hidden px-1 py-1">
              {version ? (
                <div className="flex items-center justify-between">
                  <span className="text-[0.5rem] font-medium uppercase tracking-[0.22em] text-muted-foreground/50">
                    Build
                  </span>
                  <span className="font-mono text-[0.6rem] text-muted-foreground/60">
                    v{version}
                  </span>
                </div>
              ) : (
                <div className="h-3 w-16 bg-muted/40 shimmer" />
              )}
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex min-w-0 h-svh flex-col bg-background">
          {/* Top header bar */}
          <header className={cn(
            "flex h-12 shrink-0 items-center gap-2 px-3 md:px-4",
            "border-b border-border/60",
            "bg-background/90 backdrop-blur-md",
            "transition-all duration-150",
          )}>
            <MobileSidebarTrigger />
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <div className="min-w-0 flex-1 overflow-hidden">
                <AppPageHeader />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {version ? (
                  <span className="hidden font-mono text-[0.6rem] text-muted-foreground/50 sm:block">
                    v{version}
                  </span>
                ) : null}
                <ModeToggle />
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main
            key={pathname}
            className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-none p-4 md:p-5 animate-fade-up"
          >
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
