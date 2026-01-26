"use client"

import { useCallback, useEffect, useRef } from "react"

/**
 * Hook to add arrow key navigation to sidebar menu items.
 * - Arrow Down: Move focus to next menu item
 * - Arrow Up: Move focus to previous menu item
 * - Home: Move focus to first menu item
 * - End: Move focus to last menu item
 */
export function useSidebarKeyboardNav() {
  const sidebarRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    // Only handle navigation keys
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      return
    }

    // Get all focusable menu buttons/links in the sidebar
    const focusableItems = Array.from(
      sidebar.querySelectorAll<HTMLElement>(
        '[data-sidebar="menu-button"]:not([disabled]), [data-sidebar="menu-button"] a:not([disabled])'
      )
    )

    if (focusableItems.length === 0) return

    const currentIndex = focusableItems.findIndex(
      (item) => item === document.activeElement || item.contains(document.activeElement)
    )

    // Only handle if focus is within the sidebar
    if (currentIndex === -1) return

    event.preventDefault()

    let nextIndex: number

    switch (event.key) {
      case "ArrowDown":
        nextIndex = currentIndex < focusableItems.length - 1 ? currentIndex + 1 : 0
        break
      case "ArrowUp":
        nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableItems.length - 1
        break
      case "Home":
        nextIndex = 0
        break
      case "End":
        nextIndex = focusableItems.length - 1
        break
      default:
        return
    }

    focusableItems[nextIndex]?.focus()
  }, [])

  useEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    sidebar.addEventListener("keydown", handleKeyDown)
    return () => sidebar.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return sidebarRef
}
