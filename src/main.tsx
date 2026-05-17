import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { ThemeProvider } from "next-themes"
import React from "react"
import ReactDOM from "react-dom/client"

import { NotificationInit } from "@/components/notification-init"
import { ThemeSync } from "@/components/theme-sync"
import { router } from "@/router"

import "./App.css"

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="voxia-ui-theme"
      disableTransitionOnChange
    >
      <ThemeSync />
      <NotificationInit />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
