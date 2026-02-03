"use client"

import { useEffect, useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { AppSidebarContent } from "@/components/app-sidebar"

const SIDEBAR_STATE_KEY = "sidebar-state"

interface SidebarLayoutProps {
  children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [open, setOpen] = useState(false)
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
    <div className="h-screen max-h-screen overflow-hidden">
      {/* Menu trigger button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-40"
        onClick={() => handleOpenChange(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Navigation Sheet */}
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="left" className="w-80 p-0 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <AppSidebarContent onNavigate={() => handleOpenChange(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="h-full overflow-hidden">
        {children}
      </div>
    </div>
  )
}
