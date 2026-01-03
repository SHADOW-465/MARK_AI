"use client"

import { usePathname } from "next/navigation"
import { Home, Folder, Brain, BookOpen, BarChart2, Calendar, LogOut, Bell, Menu, MoreHorizontal, TrendingUp } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavbarStudentProps {
    userName: string
    userEmail: string
    userInitials: string
}

export const NavbarStudent = ({ userName, userEmail, userInitials }: NavbarStudentProps) => {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    // Helper for active state
    const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/")

    const NavItem = ({ href, icon: Icon, label, active, onClick }: { href: string; icon: any; label: string; active: boolean; onClick?: () => void }) => (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                active
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
        >
            <Icon size={18} />
            <span className="whitespace-nowrap">{label}</span>
        </Link>
    )

    return (
        <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none">
            {/* Outer Glass Container */}
            <nav className="pointer-events-auto flex items-center justify-between w-full max-w-[1600px] h-20 px-4 rounded-full bg-background/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-300">

                {/* Left Section: Mobile Menu Trigger + Logo */}
                <div className="flex items-center gap-4">
                    <div className="lg:hidden">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="-ml-2">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] p-0 border-r border-border bg-background/95 backdrop-blur-xl">
                                <div className="flex flex-col h-full">
                                    <div className="p-6 border-b border-border/50">
                                        <Logo />
                                    </div>
                                    <div className="flex flex-col px-4 py-6 gap-2 font-display">
                                        <NavItem href="/student/dashboard" icon={Home} label="Home" active={pathname === "/student/dashboard"} onClick={() => setIsOpen(false)} />
                                        <NavItem href="/student/vault" icon={BookOpen} label="Library" active={isActive("/student/vault") || isActive("/student/study")} onClick={() => setIsOpen(false)} />
                                        <NavItem href="/student/performance" icon={BarChart2} label="Insights" active={isActive("/student/performance") || isActive("/student/analytics")} onClick={() => setIsOpen(false)} />
                                        <NavItem href="/student/flashcards" icon={Brain} label="Flashcards" active={isActive("/student/flashcards")} onClick={() => setIsOpen(false)} />
                                    </div>

                                    {/* Bottom Profile Section Mobile */}
                                    <div className="mt-auto p-4 border-t border-border/50 bg-secondary/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-md flex-shrink-0">{userInitials}</div>
                                                <div className="flex flex-col overflow-hidden min-w-0">
                                                    <span className="text-sm font-bold text-foreground leading-none truncate">{userName}</span>
                                                    <span className="text-xs text-muted-foreground mt-1 truncate">{userEmail}</span>
                                                </div>
                                            </div>
                                            <form action="/auth/sign-out" method="post">
                                                <button className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                                    <LogOut size={18} />
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <div className="flex-shrink-0">
                        <Logo />
                    </div>
                </div>

                {/* Center Navigation - Desktop */}
                <div className="hidden lg:flex items-center gap-1 p-1 bg-secondary/30 backdrop-blur-md rounded-full border border-white/5">
                    <NavItem href="/student/dashboard" icon={Home} label="Home" active={pathname === "/student/dashboard"} />
                    <NavItem href="/student/vault" icon={BookOpen} label="Library" active={isActive("/student/vault") || isActive("/student/study")} />
                    <NavItem href="/student/performance" icon={BarChart2} label="Insights" active={isActive("/student/performance") || isActive("/student/analytics")} />
                    <NavItem href="/student/flashcards" icon={Brain} label="Flashcards" active={isActive("/student/flashcards")} />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <ThemeToggle />

                    <button className="relative p-2 rounded-full hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
                    </button>

                    <div className="hidden md:flex items-center gap-3 pl-4 border-l border-border/50">
                        <div className="flex flex-col items-end min-w-[60px]">
                            <span className="text-sm font-bold text-foreground leading-none truncate max-w-[120px]">{userName}</span>
                            <span className="text-xs text-muted-foreground mt-1">Student</span>
                        </div>
                        <div className="group relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center font-bold text-sm text-black shadow-lg cursor-pointer transform hover:scale-105 transition-transform">
                                {userInitials}
                            </div>

                            <div className="absolute right-0 top-full pt-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all transform translate-y-2 group-hover:translate-y-0">
                                <form action="/auth/sign-out" method="post">
                                    <button className="flex items-center gap-3 w-40 p-3 bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-sm text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all">
                                        <LogOut size={16} />
                                        <span className="font-bold">Sign Out</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    )
}
