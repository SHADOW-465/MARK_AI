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
}

export function SidebarNavigation({ items, userName, userEmail, userInitials, role }: SidebarNavigationProps) {
    const pathname = usePathname()

    return (
        <div className="flex flex-col h-full w-full bg-background text-card-foreground">
            <div className="h-20 flex px-6 items-center border-b border-border/50 shrink-0">
                <Logo />
            </div>

            <div className="flex-1 py-6 px-4 flex flex-col gap-1.5 overflow-y-auto w-full">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                    Menu
                </div>
                {items.map((item) => {
                    const isHome = (item.href === "/dashboard" || item.href === "/student/dashboard")
                    const actuallyActive = isHome ? pathname === item.href : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden",
                                actuallyActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            <item.icon size={18} className={cn(
                                "transition-colors",
                                actuallyActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            <span className="font-semibold">{item.label}</span>
                            {actuallyActive && (
                                <div className="absolute left-0 top-[10%] bottom-[10%] w-1 bg-primary rounded-r-md"></div>
                            )}
                        </Link>
                    )
                })}
            </div>

            <div className="p-4 border-t border-border/50 mt-auto shrink-0">
                <div className="p-3 bg-secondary/50 rounded-xl flex items-center gap-3 mb-2 border border-border/50">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-primary flex items-center justify-center font-bold text-sm text-primary-foreground shadow-sm">
                        {userInitials}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-sm font-bold text-foreground truncate leading-tight mb-0.5">{userName}</p>
                        <p className="text-xs text-muted-foreground truncate">{role}</p>
                    </div>
                </div>
                <form action="/auth/sign-out" method="post">
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <LogOut size={16} className="mr-3" />
                        <span className="font-medium">Sign out</span>
                    </Button>
                </form>
            </div>
        </div>
    )
}
