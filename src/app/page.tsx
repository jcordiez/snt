"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export default function WelcomePage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-6 py-4 border-b flex items-center">
        <SidebarTrigger />
      </header>

      {/* Main Content: Welcome Screen */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">
            SNT Intervention Planning Tool
          </h1>

          <p className="text-lg text-muted-foreground">
            Plan and visualize malaria intervention strategies across districts.
            Define rules based on epidemiological metrics to automatically assign
            interventions, view coverage on interactive maps, and analyze budget implications.
          </p>

          <div className="pt-4 text-muted-foreground">
            <p className="font-medium">
              Select a plan from the sidebar to begin, or create a new plan.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
