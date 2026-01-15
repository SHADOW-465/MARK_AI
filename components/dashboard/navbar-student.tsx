"use client"

import { usePathname } from "next/navigation"
import { Home, Brain, BookOpen, BarChart2, LogOut, Bell, Menu } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface NavbarStudentProps {
    userName: string
    userEmail: string
    userInitials: string
}

export const NavbarStudent = ({ userName, userEmail, userInitials }: NavbarStudentProps) => {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/")

    const NavItem = ({ href, icon: Icon, label, active, onClick }: { href: string; icon: React.ElementType; label: string; active: boolean; onClick?: () => void }) => (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
        >
            <Icon size={18} />
            <span className="whitespace-nowrap">{label}</span>
        </Link>
    )

    return (
        <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none">
            <nav className="pointer-events-auto flex items-center justify-between w-full max-w-[1600px] h-16 px-4 rounded-xl bg-card/80 backdrop-blur-lg border border-border shadow-sm transition-all duration-200">

                {/* Left Section: Mobile Menu + Logo */}
                <div className="flex items-center gap-4">
                    <div className="lg:hidden">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="-ml-2">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[280px] p-0 border-r border-border bg-background">
                                <div className="flex flex-col h-full">
                                    <div className="p-6 border-b border-border">
                                        <Logo />
                                    </div>
                                    <div className="flex flex-col px-4 py-6 gap-1">
                                        <NavItem href="/student/dashboard" icon={Home} label="Home" active={pathname === "/student/dashboard"} onClick={() => setIsOpen(false)} />
                                        <NavItem href="/student/vault" icon={BookOpen} label="Library" active={isActive("/student/vault") || isActive("/student/study")} onClick={() => setIsOpen(false)} />
                                        <NavItem href="/student/performance" icon={BarChart2} label="Insights" active={isActive("/student/performance") || isActive("/student/analytics")} onClick={() => setIsOpen(false)} />
                                        <NavItem href="/student/flashcards" icon={Brain} label="Flashcards" active={isActive("/student/flashcards")} onClick={() => setIsOpen(false)} />
                                    </div>

                                    {/* Mobile Profile */}
                                    <div className="mt-auto p-4 border-t border-border bg-muted/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center font-semibold text-sm text-primary-foreground">{userInitials}</div>
                                                <div className="flex flex-col overflow-hidden min-w-0">
                                                    <span className="text-sm font-semibold text-foreground leading-none truncate">{userName}</span>
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
                <div className="hidden lg:flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
                    <NavItem href="/student/dashboard" icon={Home} label="Home" active={pathname === "/student/dashboard"} />
                    <NavItem href="/student/vault" icon={BookOpen} label="Library" active={isActive("/student/vault") || isActive("/student/study")} />
                    <NavItem href="/student/performance" icon={BarChart2} label="Insights" active={isActive("/student/performance") || isActive("/student/analytics")} />
                    <NavItem href="/student/flashcards" icon={Brain} label="Flashcards" active={isActive("/student/flashcards")} />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />

                    <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
                    </button>

                    <div className="hidden md:flex items-center gap-3 pl-3 border-l border-border">
                        <div className="flex flex-col items-end min-w-[60px]">
                            <span className="text-sm font-semibold text-foreground leading-none truncate max-w-[120px]">{userName}</span>
                            <span className="text-xs text-muted-foreground mt-1">Student</span>
                        </div>
                        <div className="group relative">
                            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-semibold text-sm text-primary-foreground cursor-pointer">
                                {userInitials}
                            </div>

                            {/* Dropdown */}
                            <div className="absolute right-0 top-full pt-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                                <form action="/auth/sign-out" method="post">
                                    <button className="flex items-center gap-2 w-32 p-2 bg-popover border border-border rounded-lg shadow-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
                                        <LogOut size={16} />
                                        <span>Sign Out</span>
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
