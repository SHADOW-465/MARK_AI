"use client"

import { useState } from "react"
import { SidebarNavigation } from "./sidebar-navigation"
import { TopHeader } from "./top-header"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
    LayoutDashboard, FileText, CheckCircle, Users, Settings,
    Home, BookOpen, BarChart2, Brain
} from "lucide-react"

const TEACHER_NAV = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/exams", label: "Exams", icon: FileText, matchPrefix: true },
    { href: "/dashboard/grading", label: "Grading", icon: CheckCircle, matchPrefix: true },
    { href: "/dashboard/students", label: "Students", icon: Users, matchPrefix: true },
    { href: "/dashboard/settings", label: "Settings", icon: Settings, matchPrefix: true },
]

const STUDENT_NAV = [
    { href: "/student/dashboard", label: "Home", icon: Home },
    { href: "/student/vault", label: "Library", icon: BookOpen, matchPrefix: true },
    { href: "/student/performance", label: "Insights", icon: BarChart2, matchPrefix: true },
    { href: "/student/flashcards", label: "Flashcards", icon: Brain, matchPrefix: true },
]

interface DashboardShellProps {
    children: React.ReactNode
    userName: string
    userEmail: string
    userInitials: string
    role: "Teacher" | "Student"
}

export function DashboardShell({ children, userName, userEmail, userInitials, role }: DashboardShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const items = role === "Teacher" ? TEACHER_NAV : STUDENT_NAV

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-[280px] hidden md:block border-r border-border z-40 bg-background">
                <SidebarNavigation
                    items={items}
                    userName={userName}
                    userEmail={userEmail}
                    userInitials={userInitials}
                    role={role}
                />
            </aside>

            {/* Mobile Sidebar */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetContent side="left" className="p-0 border-r-border w-[280px]">
                    <VisuallyHidden>
                        <SheetTitle>Navigation Menu</SheetTitle>
                    </VisuallyHidden>
                    <SidebarNavigation
                        items={items}
                        userName={userName}
                        userEmail={userEmail}
                        userInitials={userInitials}
                        role={role}
                    />
                </SheetContent>
            </Sheet>

            {/* Main Content Area */}
            <div className="md:pl-[280px] flex flex-col flex-1 min-h-screen">
                <TopHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
                <main className="flex-1 p-6 md:p-8 max-w-[1440px] w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
