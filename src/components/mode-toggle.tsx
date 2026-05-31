import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSettingsStore, type Theme } from "@/store/useSettingsStore"
import { cn } from "@/lib/utils"

const applyTheme = (value: Theme, setNextTheme: (t: string) => void) => {
  setNextTheme(value)
  useSettingsStore.getState().setTheme(value)
}

export const ModeToggle = () => {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <Button type="button" variant="ghost" size="icon-sm" disabled aria-label="Theme">
        <Sun className="size-3.5 opacity-0" />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Toggle theme"
          title="Theme"
          className="text-muted-foreground hover:text-foreground"
        >
          {isDark
            ? <Moon className="size-3.5" aria-hidden />
            : <Sun className="size-3.5" aria-hidden />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36 text-xs">
        <DropdownMenuItem
          onClick={() => applyTheme("light", setTheme)}
          className={cn(!isDark && "text-signal")}
        >
          <Sun className="mr-2 size-3.5" aria-hidden />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => applyTheme("dark", setTheme)}
          className={cn(isDark && "text-signal")}
        >
          <Moon className="mr-2 size-3.5" aria-hidden />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme("system", setTheme)}>
          <Monitor className="mr-2 size-3.5" aria-hidden />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
