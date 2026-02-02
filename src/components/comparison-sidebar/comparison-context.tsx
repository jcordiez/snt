"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ComparisonSidebarContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const ComparisonSidebarContext = createContext<ComparisonSidebarContextValue>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
});

export function useComparisonSidebar() {
  return useContext(ComparisonSidebarContext);
}

export function ComparisonSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <ComparisonSidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </ComparisonSidebarContext.Provider>
  );
}
