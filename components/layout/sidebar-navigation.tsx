"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  matchPrefix?: boolean
}

interface SidebarNavigationProps {
  items: NavItem[]
  userName: string
  userEmail: string
  userInitials: string
  role: "Teacher" | "Student"
  collapsed?: boolean
}

export function SidebarNavigation({
  items,
  userName,
  userEmail,
  userInitials,
  role,
  collapsed = false,
}: SidebarNavigationProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-full flex-col bg-secondary/70 text-card-foreground">
      <div className={cn("flex h-20 items-center border-b border-border/60", collapsed ? "justify-center px-2" : "px-5")}> 
        {collapsed ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <span className="text-sm font-bold">M</span>
          </div>
        ) : (
          <Logo />
        )}
      </div>

      <div className={cn("flex-1 overflow-y-auto py-6", collapsed ? "px-2" : "px-3")}> 
        {!collapsed && (
          <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Navigation
          </div>
        )}

        <div className="space-y-1">
          {items.map((item) => {
            const isHome = item.href === "/dashboard" || item.href === "/student/dashboard"
            const isActive = isHome ? pathname === item.href : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-xl border border-transparent px-3 py-3 text-sm font-medium transition-all",
                  collapsed ? "justify-center" : "gap-3",
                  isActive
                    ? "border-primary/35 bg-primary/15 text-foreground shadow-[var(--shadow-glow)]"
                    : "text-muted-foreground hover:border-border hover:bg-card/70 hover:text-foreground",
                )}
              >
                <item.icon size={18} className={cn(isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>
      </div>

      <div className={cn("mt-auto border-t border-border/60 p-3", collapsed && "p-2")}> 
        {!collapsed && (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{role} • {userEmail}</p>
            </div>
          </div>
        )}

        <form action="/auth/sign-out" method="post">
          <Button variant="ghost" className={cn("w-full text-muted-foreground hover:text-destructive", collapsed ? "justify-center" : "justify-start")}>
            <LogOut size={16} className={cn(!collapsed && "mr-2")} />
            {!collapsed && <span>Sign out</span>}
          </Button>
        </form>
      </div>
    </div>
  )
}

