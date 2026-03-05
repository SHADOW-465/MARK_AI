"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Network, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NAV_ITEMS = [
    { href: "/student/dashboard", label: "Dashboard" },
    { href: "/student/ai-guide", label: "AI Guide" },
    { href: "/student/performance", label: "Performance" },
    { href: "/student/flashcards", label: "Flashcards" },
    { href: "/student/planner", label: "Planner" },
    { href: "/student/vault", label: "Vault" },
]

export function StudentTopbar() {
    const pathname = usePathname()
    const router = useRouter()

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/")
        router.refresh()
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full h-[88px] flex items-center justify-between px-6 lg:px-10 border-b border-border/40 bg-background/95 backdrop-blur-sm">

            {/* Logo */}
            <Link href="/student/dashboard" className="flex items-center gap-3 group flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--student-primary)] text-white shadow-md shadow-[var(--student-primary)]/20 group-hover:scale-105 transition-transform">
                    <Network size={22} />
                </div>
                <span className="font-display text-xl font-bold text-foreground hidden sm:block">
                    MARK AI
                </span>
            </Link>

            {/* Center Nav Pills */}
            <nav className="hidden md:flex items-center gap-1 p-1.5 bg-secondary/50 rounded-full border border-border/50">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-semibold transition-all",
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
            <div className="flex items-center gap-3 flex-shrink-0">
                <ThemeToggle />

                <div className="h-8 w-px bg-border hidden sm:block" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm hover:opacity-90 transition-opacity">
                            <User size={18} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleSignOut}
                            className="text-destructive focus:text-destructive cursor-pointer"
                        >
                            <LogOut size={16} className="mr-2" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
