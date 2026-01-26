"use client"

import { useState } from "react"
import { FileText, Map } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const plans = [
  { id: "bau", name: "BAU" },
  { id: "nsp-2026-30", name: "NSP 2026-30" },
]

export function AppSidebar() {
  const [activePlanId, setActivePlanId] = useState<string>("nsp-2026-30")

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Map className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">SNT</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Subnational Tailoring
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Plans Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Plans</SidebarGroupLabel>
          {/* Task 5: Plus button will go here */}
          <SidebarGroupContent>
            <SidebarMenu>
              {plans.map((plan) => (
                <SidebarMenuItem key={plan.id}>
                  <SidebarMenuButton
                    isActive={activePlanId === plan.id}
                    onClick={() => setActivePlanId(plan.id)}
                    tooltip={plan.name}
                  >
                    <FileText className="size-4" />
                    <span>{plan.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Task 6-8: Other navigation items will go here */}
      </SidebarContent>

      <SidebarFooter>
        {/* Task 9: Footer items will go here */}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
