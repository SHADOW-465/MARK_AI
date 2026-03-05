"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Headphones, Network } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { NotificationDropdown } from "@/components/dashboard/notification-dropdown"

const NAV_ITEMS = [
    { href: "/student/vault", label: "All courses" },
    { href: "/student/dashboard", label: "Dashboard" },
    { href: "/student/performance", label: "Statistic" },
    { href: "/student/ai-guide", label: "AI-assistant" },
    { href: "/student/support", label: "Support" }, // Optional
]

interface StudentTopbarProps {
    userName: string
    userInitials: string
}

export function StudentTopbar({ userName, userInitials }: StudentTopbarProps) {
    const pathname = usePathname()

    return (
        <header className="w-full h-[88px] flex items-center justify-between px-6 lg:px-10 border-b border-border/40">

            {/* Logo Area */}
            <Link href="/student/dashboard" className="flex items-center gap-3 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--student-primary)] text-white shadow-md shadow-[var(--student-primary)]/20 group-hover:scale-105 transition-transform">
                    <Network size={22} />
                </div>
                <span className="font-display text-xl font-bold text-foreground">
                    MARK AI
                </span>
            </Link>

            {/* Center Navigation Pills */}
            <nav className="hidden md:flex items-center gap-2 p-1.5 bg-secondary/50 rounded-full border border-border/50">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "px-5 py-2.5 rounded-full text-sm font-semibold transition-all",
                                isActive
                                    ? "bg-foreground text-background shadow-md"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2">
                    {/* <ThemeSwitcher /> */}
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
                        <Headphones size={20} />
                    </Button>
                    <NotificationDropdown />
                </div>

                <div className="h-8 w-px bg-border mx-1 hidden sm:block" />

                {/* User Avatar */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm overflow-hidden">
                        {/* If we had an image we would put it here. Using initials. */}
                        <span>{userInitials}</span>
                    </div>
                </div>
            </div>
        </header>
    )
}
