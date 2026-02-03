"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
import { cn } from "@/lib/utils"
import { PREDEFINED_PLANS } from "@/data/predefined-plans"

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

const PLAN_COLORS = ["#FFC107", "#673AB7", "#3D74FF", "#FF9800", "#F44336", "#9C27B0", "#2196F3", "#00BCD4", "#8BC34A", "#FF5722", "#607D8B"]

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
}

function NavItem({ href, icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

interface AppSidebarContentProps {
  onNavigate?: () => void
}

export function AppSidebarContent({ onNavigate }: AppSidebarContentProps) {
  const pathname = usePathname()

  // Determine active plan from URL
  const isNewPlanActive = pathname === "/plan"
  const activePlanId = pathname.startsWith("/plan/") ? pathname.split("/")[2] : null

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3">
          <div className="flex aspect-square size-10 items-center justify-center overflow-hidden rounded-lg">
            <RDCFlag className="size-10" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Democratic Republic of Congo</span>
            <span className="truncate text-xs text-muted-foreground">
              Subnational Malaria Tailoring
            </span>
          </div>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Actions Group */}
        <div className="space-y-1">
          <NavItem
            href="/plan"
            icon={<Plus className="size-4" />}
            label="New plan"
            isActive={isNewPlanActive}
            onClick={onNavigate}
          />
          <NavItem
            href="/search"
            icon={<Search className="size-4" />}
            label="Search plans"
            isActive={pathname === "/search"}
            onClick={onNavigate}
          />
          <NavItem
            href="/compare"
            icon={<GitCompareArrows className="size-4" />}
            label="Compare plans"
            isActive={pathname === "/compare"}
            onClick={onNavigate}
          />
        </div>

        {/* Settings Group */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Settings
          </p>
          <NavItem
            href="/layers"
            icon={<Layers className="size-4" />}
            label="Metric layers"
            isActive={pathname === "/layers"}
            onClick={onNavigate}
          />
          <NavItem
            href="/guidelines"
            icon={<BookOpen className="size-4" />}
            label="Intervention guidelines"
            isActive={pathname === "/guidelines"}
            onClick={onNavigate}
          />
          <NavItem
            href="/cost-settings"
            icon={<CircleDollarSign className="size-4" />}
            label="Cost settings"
            isActive={pathname === "/cost-settings"}
            onClick={onNavigate}
          />
          <NavItem
            href="/composite-scores"
            icon={<Calculator className="size-4" />}
            label="Composite scores"
            isActive={pathname === "/composite-scores"}
            onClick={onNavigate}
          />
        </div>

        {/* Plans Group */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Plans
          </p>
          {PREDEFINED_PLANS.map((plan, index) => (
            <Link
              key={plan.id}
              href={`/plan/${plan.id}`}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                activePlanId === plan.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div
                className="size-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: PLAN_COLORS[index % PLAN_COLORS.length] }}
              />
              <span className="truncate">{plan.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4 space-y-1">
        <NavItem
          href="/help"
          icon={<CircleHelp className="size-4" />}
          label="Help"
          isActive={pathname === "/help"}
          onClick={onNavigate}
        />
        <NavItem
          href="/feedback"
          icon={<MessageSquareMore className="size-4" />}
          label="Feedback"
          isActive={pathname === "/feedback"}
          onClick={onNavigate}
        />
        <NavItem
          href="/account"
          icon={<CircleUser className="size-4" />}
          label="User account"
          isActive={pathname === "/account"}
          onClick={onNavigate}
        />
      </div>
    </div>
  )
}
