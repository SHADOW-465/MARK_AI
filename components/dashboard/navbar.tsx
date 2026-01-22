"use client"

import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Users, Settings, LogOut, CheckCircle, Bell, Menu } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"
import { cn } from "@/lib/utils"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface NavbarProps {
    isTeacher: boolean
    userName: string
    userEmail: string
    userInitials: string
}

export const Navbar = ({ isTeacher, userName, userEmail, userInitials }: NavbarProps) => {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/")

    const NavItem = ({ href, icon: Icon, label, active, onClick }: { href: string; icon: React.ElementType; label: string; active: boolean; onClick?: () => void }) => (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            )}
        >
            <Icon size={18} />
            <span>{label}</span>
        </Link>
    )

    return (
        <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none">
            <nav className="pointer-events-auto flex items-center justify-between w-full max-w-container-2xl h-16 md:h-20 px-6 rounded-full liquid-glass transition-all duration-300">

                {/* Left Section: Mobile Menu + Logo */}
                <div className="flex items-center gap-6">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="-ml-2 rounded-full">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] p-0 border-r border-border bg-background/95 backdrop-blur-xl">
                                <div className="flex flex-col h-full">
                                    <div className="p-8 border-b border-border/50">
                                        <Logo />
                                    </div>
                                    <div className="flex flex-col px-6 py-8 gap-2">
                                        <NavItem href="/dashboard" icon={LayoutDashboard} label="Overview" active={pathname === "/dashboard"} onClick={() => setIsOpen(false)} />
                                        <NavItem href="/dashboard/exams" icon={FileText} label="Exams" active={pathname.includes("/exams")} onClick={() => setIsOpen(false)} />
                                        <NavItem href="/dashboard/grading" icon={CheckCircle} label="Grading" active={pathname.includes("/grading")} onClick={() => setIsOpen(false)} />
                                        <NavItem href="/dashboard/students" icon={Users} label="Students" active={pathname.includes("/students")} onClick={() => setIsOpen(false)} />
                                        <NavItem href="/dashboard/settings" icon={Settings} label="Settings" active={pathname.includes("/settings")} onClick={() => setIsOpen(false)} />
                                    </div>

                                    {/* Mobile Profile */}
                                    <div className="mt-auto p-6 border-t border-border/50 bg-secondary/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-sm text-primary-foreground shadow-md">{userInitials}</div>
                                                <div className="flex flex-col overflow-hidden min-w-0">
                                                    <span className="text-sm font-bold text-foreground leading-none truncate">{userName}</span>
                                                    <span className="text-xs text-muted-foreground mt-1 truncate">{userEmail}</span>
                                                </div>
                                            </div>
                                            <form action="/auth/sign-out" method="post">
                                                <button className="p-2.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                                    <LogOut size={20} />
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
                <div className="hidden lg:flex items-center gap-1 p-1.5 bg-secondary/50 rounded-full border border-white/10 dark:border-white/5 shadow-inner">
                    <NavItem href="/dashboard" icon={LayoutDashboard} label="Overview" active={pathname === "/dashboard"} />
                    <NavItem href="/dashboard/exams" icon={FileText} label="Exams" active={pathname.includes("/exams")} />
                    <NavItem href="/dashboard/grading" icon={CheckCircle} label="Grading" active={pathname.includes("/grading")} />
                    <NavItem href="/dashboard/students" icon={Users} label="Students" active={pathname.includes("/students")} />
                    <NavItem href="/dashboard/settings" icon={Settings} label="Settings" active={pathname.includes("/settings")} />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">

                    <button className="relative p-2.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <Bell size={22} />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-card shadow-sm"></span>
                    </button>

                    <div className="hidden md:flex items-center gap-4 pl-4 border-l border-border/50">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-foreground">{userName}</span>
                            <span className="text-xs text-muted-foreground font-medium">Teacher</span>
                        </div>
                        <div className="group relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center font-bold text-sm text-primary-foreground cursor-pointer shadow-md hover:shadow-lg transition-all hover:scale-105">
                                {userInitials}
                            </div>

                            {/* Dropdown */}
                            <div className="absolute right-0 top-full pt-4 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                                <form action="/auth/sign-out" method="post">
                                    <button className="flex items-center gap-3 w-36 p-3 bg-popover/90 backdrop-blur-xl border border-border rounded-2xl shadow-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all">
                                        <LogOut size={18} />
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
