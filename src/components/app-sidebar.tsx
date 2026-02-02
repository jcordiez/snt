"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebarKeyboardNav } from "@/hooks/use-sidebar-keyboard-nav"
import {
  BookOpen,
  Calculator,
  CircleDollarSign,
  CircleHelp,
  CircleUser,
  GitCompareArrows,
  Layers,
  MessageSquareMore,
  Plus,
  Search,
} from "lucide-react"

function RDCFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 4 3"
      className={className}
      role="img"
      aria-label="Democratic Republic of Congo flag"
    >
      {/* Sky blue background */}
      <rect width="4" height="3" fill="#007FFF" />
      {/* Yellow border of diagonal stripe */}
      <polygon points="0,2.35 0,3 0.5,3 4,0.65 4,0 3.5,0" fill="#F7D618" />
      {/* Red diagonal stripe */}
      <polygon points="0,2.5 0,3 0.35,3 4,0.5 4,0 3.65,0" fill="#CE1021" />
      {/* Yellow star */}
      <polygon
        points="0.5,0.15 0.56,0.35 0.77,0.35 0.61,0.48 0.67,0.68 0.5,0.55 0.33,0.68 0.39,0.48 0.23,0.35 0.44,0.35"
        fill="#F7D618"
      />
    </svg>
  )
}
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
import { PREDEFINED_PLANS } from "@/data/predefined-plans"

const PLAN_COLORS = ["#FFC107", "#673AB7", "#3D74FF", "#FF9800", "#F44336", "#9C27B0", "#2196F3", "#00BCD4", "#8BC34A", "#FF5722", "#607D8B"]

export function AppSidebar() {
  const pathname = usePathname()
  const sidebarRef = useSidebarKeyboardNav()

  // Determine active plan from URL
  const isNewPlanActive = pathname === "/plan"
  const activePlanId = pathname.startsWith("/plan/") ? pathname.split("/")[2] : null

  return (
    <Sidebar ref={sidebarRef} collapsible="offcanvas" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg">
                  <RDCFlag className="size-8" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Democratic Republic of Congo</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Subnational Malaria Tailoring
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Actions Group */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="New plan" isActive={isNewPlanActive}>
                  <Link href="/plan">
                    <Plus className="size-4" />
                    <span>New plan</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Search plans">
                  <Link href="/search">
                    <Search className="size-4" />
                    <span>Search plans</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Compare plans">
                  <Link href="/compare">
                    <GitCompareArrows className="size-4" />
                    <span>Compare plans</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Metric layers" isActive={pathname === "/layers"}>
                  <Link href="/layers">
                    <Layers className="size-4" />
                    <span>Metric layers</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Intervention guidelines" isActive={pathname === "/guidelines"}>
                  <Link href="/guidelines">
                    <BookOpen className="size-4" />
                    <span>Intervention guidelines</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Cost settings" isActive={pathname === "/cost-settings"}>
                  <Link href="/cost-settings">
                    <CircleDollarSign className="size-4" />
                    <span>Cost settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Composite scores" isActive={pathname === "/composite-scores"}>
                  <Link href="/composite-scores">
                    <Calculator className="size-4" />
                    <span>Composite scores</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Plans Group */}
        
        <SidebarGroup>
          <SidebarGroupLabel>Plans</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PREDEFINED_PLANS.map((plan, index) => (
                <SidebarMenuItem key={plan.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={activePlanId === plan.id}
                    tooltip={plan.name}
                  >
                    <Link href={`/plan/${plan.id}`}>
                      <div className="size-4 rounded-full" style={{ backgroundColor: PLAN_COLORS[index % PLAN_COLORS.length] }} />
                      <span>{plan.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Help" isActive={pathname === "/help"}>
              <Link href="/help">
                <CircleHelp className="size-4" />
                <span>Help</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Feedback" isActive={pathname === "/feedback"}>
              <Link href="/feedback">
                <MessageSquareMore className="size-4" />
                <span>Feedback</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="User account" isActive={pathname === "/account"}>
              <Link href="/account">
                <CircleUser className="size-4" />
                <span>User account</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
