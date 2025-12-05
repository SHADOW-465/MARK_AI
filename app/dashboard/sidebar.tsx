"use client"

import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Users, MessageSquare, Settings, LogOut, CheckCircle } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { NavButton } from "@/components/ui/nav-button"

interface SidebarProps {
    isTeacher: boolean
    userName: string
    userEmail: string
    userInitials: string
}

export const Sidebar = ({ isTeacher, userName, userEmail, userInitials }: SidebarProps) => {
    const pathname = usePathname()

    // Determine active view based on pathname
    const getActiveId = () => {
        if (pathname === "/dashboard") return "overview"
        if (pathname.includes("/dashboard/exams")) return "exams"
        if (pathname.includes("/dashboard/grading")) return "grading"
        if (pathname.includes("/dashboard/students")) return "students"
        if (pathname.includes("/dashboard/results")) return "results"
        if (pathname.includes("/dashboard/messages")) return "messages"
        if (pathname.includes("/dashboard/settings")) return "settings"
        return "overview"
    }

    const activeId = getActiveId()

    return (
        <nav className="fixed lg:left-4 lg:top-4 lg:bottom-4 w-full h-16 lg:h-auto lg:w-20 lg:hover:w-64 z-50 flex lg:flex-col justify-between p-2 lg:py-8 bg-black/20 backdrop-blur-2xl border lg:border border-white/10 lg:rounded-3xl shadow-2xl lg:shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-300 group overflow-hidden hidden lg:flex">

            {/* Logo Section - Icon fixed, text animated */}
            <div className="hidden lg:block w-full">
                <Logo />
            </div>

            {/* Navigation Items */}
            <div className="flex lg:flex-col w-full justify-around lg:justify-start lg:gap-1 lg:px-0">
                <NavButton id="overview" activeId={activeId} href="/dashboard" icon={LayoutDashboard} label="Overview" />

                {isTeacher ? (
                    <>
                        <NavButton id="exams" activeId={activeId} href="/dashboard/exams" icon={FileText} label="Exams" />
                        <NavButton id="grading" activeId={activeId} href="/dashboard/grading" icon={CheckCircle} label="Grading" />
                        <NavButton id="students" activeId={activeId} href="/dashboard/students" icon={Users} label="Students" />
                    </>
                ) : (
                    <NavButton id="results" activeId={activeId} href="/dashboard/results" icon={FileText} label="Results" />
                )}

                <NavButton id="messages" activeId={activeId} href="/dashboard/messages" icon={MessageSquare} label="Messages" />
                <NavButton id="settings" activeId={activeId} href="/dashboard/settings" icon={Settings} label="Settings" />
            </div>

            {/* Bottom Profile Section */}
            <div className="hidden lg:flex flex-col w-full mt-auto gap-4 px-2 pt-6 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer relative overflow-hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-lg flex-shrink-0">{userInitials}</div>
                        <div className="flex flex-col overflow-hidden min-w-0">
                            <span className="text-sm font-bold text-white leading-none truncate">{userName}</span>
                            <span className="text-[10px] text-slate-400 mt-1 truncate">Admin</span>
                        </div>
                    </div>

                    {/* Integrated Sign Out Icon */}
                    <form action="/auth/sign-out" method="post">
                        <button className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" title="Sign Out">
                            <LogOut size={16} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Collapsed Profile Icon (Visible when sidebar is small) */}
            <div className="hidden lg:flex group-hover:hidden flex-col w-full mt-auto items-center pb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-lg">{userInitials}</div>
            </div>

        </nav>
    )
}
