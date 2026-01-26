"use client"

import { useState } from "react"
import { FileText, GitCompareArrows, Layers, Map, Plus } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Plan {
  id: string
  name: string
}

const initialPlans: Plan[] = [
  { id: "bau", name: "BAU" },
  { id: "nsp-2026-30", name: "NSP 2026-30" },
]

export function AppSidebar() {
  const [activePlanId, setActivePlanId] = useState<string>("nsp-2026-30")
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [newPlanName, setNewPlanName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCreatePlan = () => {
    if (!newPlanName.trim()) return

    const newPlan: Plan = {
      id: newPlanName.toLowerCase().replace(/\s+/g, "-"),
      name: newPlanName.trim(),
    }

    setPlans([...plans, newPlan])
    setActivePlanId(newPlan.id)
    setNewPlanName("")
    setIsDialogOpen(false)
  }

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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <SidebarGroupAction title="Create new plan">
                <Plus className="size-4" />
                <span className="sr-only">Create new plan</span>
              </SidebarGroupAction>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create new plan</DialogTitle>
                <DialogDescription>
                  Enter a name for your new plan. You can change this later.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Plan name"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreatePlan()
                    }
                  }}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePlan} disabled={!newPlanName.trim()}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

        {/* Scenario Comparisons */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Scenario comparisons">
                  <a href="/scenario-comparisons">
                    <GitCompareArrows className="size-4" />
                    <span>Scenario comparisons</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Layers */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Layers">
                  <a href="/layers">
                    <Layers className="size-4" />
                    <span>Layers</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Task 8: Cost settings will go here */}
      </SidebarContent>

      <SidebarFooter>
        {/* Task 9: Footer items will go here */}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
