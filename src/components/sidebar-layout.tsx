"use client"

import { useEffect, useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

const SIDEBAR_STATE_KEY = "sidebar-state"

interface SidebarLayoutProps {
  children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [open, setOpen] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  // Read sidebar state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STATE_KEY)
    if (stored !== null) {
      setOpen(stored === "true")
    }
    setIsLoaded(true)
  }, [])

  // Save sidebar state to localStorage when it changes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    localStorage.setItem(SIDEBAR_STATE_KEY, String(newOpen))
  }

  // Prevent hydration mismatch by not rendering until localStorage is read
  if (!isLoaded) {
    return null
  }

  return (
    <SidebarProvider open={open} onOpenChange={handleOpenChange}>
      <AppSidebar />
      <SidebarInset className="h-screen max-h-screen overflow-hidden">
        <div className="h-full overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
