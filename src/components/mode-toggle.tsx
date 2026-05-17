"use client"

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

const applyTheme = (value: Theme, setNextTheme: (t: string) => void) => {
  setNextTheme(value)
  useSettingsStore.getState().setTheme(value)
}

export const ModeToggle = () => {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button type="button" variant="outline" size="icon" disabled aria-label="Theme">
        <Sun className="size-4 opacity-0" />
      </Button>
    )
  }

  const icon =
    resolvedTheme === "dark" ? (
      <Moon className="size-4" aria-hidden />
    ) : (
      <Sun className="size-4" aria-hidden />
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="icon" aria-label="Theme menu">
          {icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem onClick={() => applyTheme("light", setTheme)}>
          <Sun className="mr-2 size-4" aria-hidden />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme("dark", setTheme)}>
          <Moon className="mr-2 size-4" aria-hidden />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme("system", setTheme)}>
          <Monitor className="mr-2 size-4" aria-hidden />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
