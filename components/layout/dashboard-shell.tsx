"use client"

import { useEffect, useState } from "react"
import { SidebarNavigation } from "./sidebar-navigation"
import { TopHeader } from "./top-header"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  Users,
  Settings,
  Home,
  BookOpen,
  BarChart2,
  Brain,
  BarChart3,
} from "lucide-react"

const TEACHER_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/exams", label: "Exams", icon: FileText, matchPrefix: true },
  { href: "/dashboard/grading", label: "Grading", icon: CheckCircle, matchPrefix: true },
  { href: "/dashboard/students", label: "Students", icon: Users, matchPrefix: true },
  { href: "/dashboard/class", label: "Class Insights", icon: BarChart3, matchPrefix: true },
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
  const [isTabletCollapsed, setIsTabletCollapsed] = useState(false)
  const items = role === "Teacher" ? TEACHER_NAV : STUDENT_NAV

  useEffect(() => {
    const syncCollapse = () => {
      const width = window.innerWidth
      setIsTabletCollapsed(width >= 768 && width < 1280)
    }

    syncCollapse()
    window.addEventListener("resize", syncCollapse)
    return () => window.removeEventListener("resize", syncCollapse)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[86px] border-r border-border/70 bg-secondary/60 backdrop-blur-xl md:block xl:w-[280px]">
        <SidebarNavigation
          items={items}
          userName={userName}
          userEmail={userEmail}
          userInitials={userInitials}
          role={role}
          collapsed={isTabletCollapsed}
        />
      </aside>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[290px] border-r-border/70 p-0">
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

      <div className="flex min-h-screen flex-col transition-all md:ml-[86px] xl:ml-[280px]">
        <TopHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 md:px-6 md:py-8 xl:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
